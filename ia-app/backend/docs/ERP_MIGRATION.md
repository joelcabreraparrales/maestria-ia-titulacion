# Migración ERP AdventureWorks → Neon (PostgreSQL)

Este documento describe el proceso completo para migrar la base de datos ERP `adventureworks` desde el contenedor Docker local hacia la base de datos en la nube [Neon](https://neon.tech) que usa el backend en producción.

---

## Arquitectura de bases de datos del proyecto

El backend maneja dos bases de datos separadas en Neon:

| Variable de entorno | Propósito |
|---|---|
| `DATABASE_URL` | Base principal: auth, sesiones, conversaciones del chatbot |
| `ERP_DATABASE_URL` | Base ERP: datos AdventureWorks (schemas `dbo`, `humanresources`, `person`, `production`, `purchasing`, `sales`) |

Este documento cubre exclusivamente la migración de `ERP_DATABASE_URL`.

---

## Requisitos previos

- Docker Desktop corriendo con el contenedor `postgresql` activo
- Base de datos `adventureworks` cargada en el contenedor local con datos de AdventureWorks2022
- Cuenta en [Neon](https://neon.tech) con un proyecto y base de datos creados para el ERP
- La cadena de conexión directa de Neon (sin pooler) para la restauración

---

## Paso 1 — Verificar la base local antes de migrar

Confirma que el contenedor tiene datos antes de hacer el dump:

```bash
docker exec postgresql psql -U postgres -d adventureworks -c "\dn"
```

Debe listar los 7 schemas:

```
      Name      |  Owner
----------------+----------
 dbo            | postgres
 humanresources | postgres
 person         | postgres
 production     | postgres
 public         | postgres
 purchasing     | postgres
 sales          | postgres
```

Verifica que hay datos en tablas clave:

```bash
docker exec postgresql psql -U postgres -d adventureworks -c "
  SELECT COUNT(*) AS employees  FROM humanresources.employee;
  SELECT COUNT(*) AS products   FROM production.product;
  SELECT COUNT(*) AS orders     FROM sales.salesorderheader;
"
```

---

## Paso 2 — Exportar la base de datos con pg_dump

Corre `pg_dump` dentro del contenedor en formato custom (comprimido, apto para `pg_restore`):

```bash
docker exec postgresql pg_dump \
  -Fc -v \
  -d "postgresql://postgres:<password>@localhost:5432/adventureworks" \
  -f /tmp/adventureworks.bak
```

**Argumentos:**
- `-Fc` — formato custom (comprimido, recomendado por Neon para `pg_restore`)
- `-v` — verbose para monitorear el progreso
- `-f` — archivo de salida dentro del contenedor

> El dump incluye schema + datos. No es necesario haber creado las tablas previamente en Neon.

---

## Paso 3 — Restaurar en Neon con pg_restore

Usa la **conexión directa** de Neon (sin `-pooler` en el hostname). Encuéntrala en el dashboard de Neon → **Connection string** → desactiva *Connection pooling*.

```bash
docker exec postgresql pg_restore \
  -v \
  -d "postgresql://<user>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require" \
  --no-owner \
  --no-acl \
  /tmp/adventureworks.bak
```

**Argumentos:**
- `-v` — verbose
- `--no-owner` — omite establecer propietario de objetos (evita errores por diferencia de roles)
- `--no-acl` — omite restaurar privilegios de acceso
- `/tmp/adventureworks.bak` — archivo generado en el Paso 2

> Se usa el contenedor `postgresql` para la restauración porque ya tiene los certificados CA necesarios para conectarse a servicios externos con SSL, a diferencia de otras imágenes Docker minimalistas.

---

## Paso 4 — Verificar la migración en Neon

Desde el mismo contenedor, conéctate a Neon y consulta las tablas migradas:

```bash
docker exec postgresql psql \
  "postgresql://<user>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require" \
  -c "
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog','information_schema')
    ORDER BY table_schema, table_name;
  "
```

Y verifica los conteos de filas en tablas principales:

```bash
docker exec postgresql psql \
  "postgresql://<user>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require" \
  -c "
    SELECT COUNT(*) AS employees    FROM humanresources.employee;
    SELECT COUNT(*) AS products     FROM production.product;
    SELECT COUNT(*) AS orders       FROM sales.salesorderheader;
    SELECT COUNT(*) AS persons      FROM person.person;
  "
```

---

## Resultado esperado

| Schema | Tablas |
|---|---|
| `dbo` | `awbuildversion`, `databaselog`, `errorlog` |
| `humanresources` | `department`, `employee`, `employeedepartmenthistory`, `employeepayhistory`, `jobcandidate`, `shift` |
| `person` | `address`, `addresstype`, `businessentity`, `businessentityaddress`, `businessentitycontact`, `contacttype`, `countryregion`, `emailaddress`, `password`, `person`, `personphone`, `phonenumbertype`, `stateprovince` |
| `production` | `billofmaterials`, `culture`, `document`, `illustration`, `location`, `product`, `productcategory`, `productcosthistory`, `productdescription`, `productdocument`, `productinventory`, `productlistpricehistory`, `productmodel`, `productmodelillustration`, `productmodelproductdescriptionculture`, `productphoto`, `productproductphoto`, `productreview`, `productsubcategory`, `scrapreason`, `transactionhistory`, `transactionhistoryarchive`, `unitmeasure`, `workorder`, `workorderrouting` |
| `purchasing` | `productvendor`, `purchaseorderdetail`, `purchaseorderheader`, `shipmethod`, `vendor` |
| `sales` | `countryregioncurrency`, `creditcard`, `currency`, `currencyrate`, `customer`, `personcreditcard`, `salesorderdetail`, `salesorderheader`, `salesorderheadersalesreason`, `salesperson`, `salespersonquotahistory`, `salesreason`, `salestaxrate`, `salesterritory`, `salesterritoryhistory`, `shoppingcartitem`, `specialoffer`, `specialofferproduct`, `store` |

**71 tablas en total · 7 schemas**

Conteos de referencia tras la migración:

| Tabla | Filas |
|---|---|
| `humanresources.employee` | 290 |
| `production.product` | 504 |
| `sales.salesorderheader` | 31 465 |
| `person.person` | 19 972 |

---

## Configuración del backend

Una vez restaurada la base, configura el archivo `.env` del backend:

```env
# Conexión ERP en Neon (se puede usar pooler para queries de lectura)
ERP_DATABASE_URL="postgresql://<user>:<password>@<endpoint>-pooler.neon.tech/<dbname>?sslmode=require&channel_binding=require"
ERP_TARGET_SCHEMAS="dbo,humanresources,person,production,public,purchasing,sales"
ERP_QUERY_TIMEOUT_MS=30000
```

> Para queries de lectura (chatbot BI) se puede usar la URL con `-pooler`. Solo usar la conexión directa para operaciones de mantenimiento (`pg_dump`, `pg_restore`, migraciones DDL).

---

## Notas sobre herramientas evaluadas

| Herramienta | Resultado | Motivo |
|---|---|---|
| **pgloader** (Docker `dimitri/pgloader`) | ❌ Descartado | La imagen no incluye certificados CA SSL — falla al conectar con Neon. Requeriría construir una imagen custom con `ca-certificates`. |
| **pg_dump + pg_restore** | ✅ Utilizado | El contenedor `postgresql` (imagen oficial `postgres:16`) ya tiene los CA certs necesarios para conectar con Neon vía SSL. Simple y confiable. |

---

## Repetir la migración (si se necesita)

Si en algún momento se necesita volver a migrar (por ejemplo, tras actualizar datos locales):

```bash
# 1. Nuevo dump
docker exec postgresql pg_dump -Fc -v \
  -d "postgresql://postgres:<password>@localhost:5432/adventureworks" \
  -f /tmp/adventureworks_$(date +%Y%m%d).bak

# 2. Restaurar (agregando --clean para DROP+CREATE antes de insertar)
docker exec postgresql pg_restore -v --clean --if-exists \
  -d "postgresql://<user>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require" \
  --no-owner --no-acl \
  /tmp/adventureworks_$(date +%Y%m%d).bak
```

> `--clean --if-exists` elimina los objetos existentes antes de recrearlos, útil para sobreescribir una migración previa.
