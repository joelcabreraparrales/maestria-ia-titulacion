# Guía de Migración de Base de Datos a la Nube (Neon)

Este documento describe el proceso completo para migrar el schema y los datos de la base de datos local `chatbot_bi` (PostgreSQL en Docker) hacia la base de datos en la nube [Neon](https://neon.tech).

---

## Requisitos previos

- Docker Desktop corriendo con el contenedor `postgresql` activo
- Cuenta en [Neon](https://neon.tech) con un proyecto creado
- Node.js instalado
- Prisma instalado (`npm i --save-dev prisma`)

---

## Paso 1 — Configurar la variable `DATABASE_URL` en `.env`

Reemplaza la URL local por la URL de conexión de Neon. La encontrarás en el dashboard de Neon bajo **Connection string**.

```env
DATABASE_URL="postgresql://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require"
```

> El archivo `prisma.config.ts` inyecta automáticamente esta variable al ejecutar comandos de Prisma.

---

## Paso 2 — Verificar `prisma.config.ts`

Asegúrate de que el archivo tenga la siguiente estructura para que Prisma lea el `.env` correctamente:

```ts
import { config } from "dotenv";
import { defineConfig } from "prisma/config";
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

---

## Paso 3 — Ejecutar la migración del schema

Este comando crea las tablas en Neon según el `schema.prisma` y genera el archivo de migración versionado:

```bash
npx prisma migrate dev --name init
```

Verifica que la salida indique conexión exitosa a tu base de datos de Neon y que la migración fue aplicada.

---

## Paso 4 — Exportar los datos desde el contenedor local

Corre `pg_dump` dentro del contenedor Docker para exportar solo los datos (no el schema):

```bash
docker exec postgresql pg_dump \
  -U postgres \
  -d chatbot_bi \
  --data-only \
  --no-owner \
  --no-acl \
  --schema=auth \
  --schema=chatbot \
  --schema=person \
  -f /tmp/chatbot_bi_data.sql
```

Luego copia el archivo al host:

```bash
docker cp postgresql:/tmp/chatbot_bi_data.sql ./docs/chatbot_bi_data.sql
```

> El archivo resultante está incluido en esta misma carpeta: `chatbot_bi_data.sql`

---

## Paso 5 — Importar los datos a Neon

Ejecuta `psql` desde el contenedor apuntando a la URL de Neon:

```bash
docker exec postgresql psql \
  "postgresql://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require" \
  -f /tmp/chatbot_bi_data.sql
```

Una salida exitosa mostrará líneas `setval` con los valores de las secuencias de cada tabla migrada.

---

## Resultado esperado

| Schema   | Tablas migradas                                              |
|----------|--------------------------------------------------------------|
| `person` | `profile`                                                    |
| `auth`   | `credential`, `role`, `credential_role`, `user_session`, `audit_log` |
| `chatbot`| `chatbot_conversation`, `chatbot_message`, `chatbot_query_result` |

---

## Notas

- El schema `public` se incluye en el `schema.prisma` pero no contiene modelos propios de la aplicación.
- Si necesitas repetir solo la migración de datos (sin recrear el schema), repite los pasos 4 y 5.
- Asegúrate de que el contenedor Docker esté corriendo **antes** de ejecutar los comandos de exportación.
