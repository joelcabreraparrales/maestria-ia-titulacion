# Lumina BI — Backend

API REST para la plataforma de inteligencia de negocios conversacional **Lumina BI**. Permite a los usuarios realizar consultas en lenguaje natural sobre una base de datos ERP y recibir resultados con SQL generado, datos tabulares y análisis producidos por un modelo LLM.

## Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 22 + TypeScript 6 |
| Framework | Express 5 |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Base de datos | PostgreSQL (multi-schema) |
| LLM | Qwen2.5-Coder-32B via HuggingFace Inference API |
| Autenticación | JWT (`jsonwebtoken`) |
| Seguridad | `helmet`, `cors`, `express-rate-limit`, `express-validator` |

---

## Requisitos previos

- **Node.js** ≥ 20
- **PostgreSQL** con los schemas `auth`, `person`, `chatbot` ya creados
- **Base de datos ERP** accesible (puede ser la misma instancia u otra)
- **Cuenta HuggingFace** con una API key válida y acceso al modelo configurado

---

## Instalación y puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# 3. Generar el cliente Prisma
npx prisma generate

# 4. Compilar
npm run build

# 5. Iniciar
npm start
```

Para desarrollo con recarga automática:

```bash
npm run start:dev
```

---

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|:---------:|-------------|
| `DATABASE_URL` | ✅ | Cadena de conexión PostgreSQL — base de datos principal (schemas `auth`, `person`, `chatbot`) |
| `JWT_SECRET` | ✅ | Secreto para firmar tokens JWT. Usar un valor seguro en producción |
| `HF_API_KEY` | ✅ | API key de HuggingFace |
| `HF_IA_MODEL` | ✅ | ID del modelo a usar (ej. `Qwen/Qwen2.5-Coder-32B-Instruct`) |
| `ERP_DATABASE_URL` | ✅ | Cadena de conexión a la base de datos ERP que el chatbot consulta |
| `JWT_EXPIRES_IN` | ⬜ | Duración del token JWT (default: `8h`) |
| `PORT` | ⬜ | Puerto del servidor (default: `3000`) |
| `ALLOWED_ORIGINS` | ⬜ | Orígenes permitidos por CORS, separados por coma (default: `*`) |
| `ERP_TARGET_SCHEMAS` | ⬜ | Schemas del ERP que el chatbot puede inspeccionar, separados por coma |
| `ERP_QUERY_TIMEOUT_MS` | ⬜ | Timeout en ms para queries al ERP (default: `30000`) |
| `SCHEMA_CACHE_TTL_SECONDS` | ⬜ | TTL en segundos del caché de schema en memoria (default: `300`) |

> Las variables marcadas con ✅ son validadas al arrancar. El servidor no inicia si alguna falta.

---

## Endpoints

### Autenticación — `/api/auth`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|:----:|
| `POST` | `/api/auth/signup` | Registrar nuevo usuario | — |
| `POST` | `/api/auth/login` | Iniciar sesión, devuelve JWT | — |
| `POST` | `/api/auth/logout` | Cerrar sesión | ✅ |
| `POST` | `/api/auth/refresh` | Renovar token JWT | ✅ |

**Login — rate limit:** máximo 10 intentos cada 15 minutos por IP.

### Perfil — `/api/profile`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|:----:|
| `GET` | `/api/profile/me` | Obtener datos del perfil del usuario autenticado | ✅ |
| `PUT` | `/api/profile/me` | Actualizar datos del perfil | ✅ |

### Chatbot — `/api/chatbot`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|:----:|
| `POST` | `/api/chatbot/query` | Procesar consulta BI, devuelve JSON completo | ✅ |
| `POST` | `/api/chatbot/query-stream` | Procesar consulta BI con streaming SSE | ✅ |
| `GET` | `/api/chatbot/conversations` | Listar conversaciones del usuario | ✅ |
| `GET` | `/api/chatbot/conversations/:id` | Obtener conversación con historial de mensajes | ✅ |
| `DELETE` | `/api/chatbot/conversations/:id` | Eliminar conversación (soft delete) | ✅ |

---

## Arquitectura

El proyecto sigue **Clean Architecture** con separación estricta por capas. Cada módulo (`auth`, `chatbot`, `profile`) replica la misma estructura:

```
src/
├── auth/
│   ├── domain/           # Entidades, clases abstractas, excepciones, interfaces
│   ├── application/      # Casos de uso e implementaciones
│   ├── infrastructure/   # Datasources y repositorios con Prisma/PostgreSQL
│   └── presentation/     # Controladores, rutas, DTOs, middlewares
├── chatbot/              # (misma estructura)
├── profile/              # (misma estructura)
├── shared/
│   ├── domain/           # Servicios abstractos reutilizables (Hash, Token, Env, Code)
│   └── middlewares/      # Middleware compartido (validate request)
└── plugins/              # Implementaciones concretas de servicios externos
    ├── bcrypt/           # HashService → BcryptHashService
    ├── jwt/              # TokenService → JwtTokenService
    ├── env/              # EnvService → EnvAdapter (env-var)
    ├── llm/              # Qwen LLM (generación SQL, análisis, streaming)
    ├── rate-limit/       # authRateLimit
    └── uuid/             # CodeGeneratorService → UuidCodeGeneratorService
```

### Flujo de una consulta BI

```
Cliente → POST /api/chatbot/query
  → validateTokenMiddleware
  → queryValidator + validateRequest
  → ChatbotController.query()
  → ChatbotService.query()
  → ImpProcessQueryUseCase
       ├── PostgreSchemaInspector  (inspecciona schemas ERP)
       ├── QwenSqlCode             (genera SQL con LLM)
       ├── SqlValidatorService     (valida SQL generado)
       ├── PostgreQueryExecutor    (ejecuta query en ERP)
       └── QwenAnalizer            (genera análisis y sugerencias)
  → ImpChatbotRepository          (persiste conversación y resultado)
  ← JSON con SQL, datos, análisis y visualizaciones sugeridas
```

---

## Base de datos

El esquema principal usa **4 schemas** de PostgreSQL:

| Schema | Tablas principales | Descripción |
|--------|--------------------|-------------|
| `person` | `profile` | Datos personales del usuario |
| `auth` | `credential`, `user_session`, `credential_role`, `role`, `audit_log` | Autenticación y sesiones |
| `chatbot` | `chatbot_conversation`, `chatbot_message`, `chatbot_query_result` | Historial del chatbot |
| `public` | — | Schema por defecto de PostgreSQL |

Para sincronizar el cliente Prisma con la base de datos existente:

```bash
# Importar schema desde la DB (introspección)
npm run prisma:import_db

# Regenerar el cliente
npm run prisma:generate_client
```
