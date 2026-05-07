# Lumina BI — Frontend

Interfaz de usuario de **Lumina BI**, plataforma de inteligencia de negocios conversacional con IA. Permite a los usuarios autenticarse, realizar consultas en lenguaje natural sobre datos ERP y visualizar resultados con gráficos y análisis generados por el modelo LLM.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 21 (standalone components) |
| Estilos | Tailwind CSS v4 |
| Lenguaje | TypeScript 5.9 |
| Gráficos | ApexCharts (`ng-apexcharts`) |
| HTTP | Angular `HttpClient` + interceptores JWT |
| Estado | `BehaviorSubject` (RxJS) + Signals |
| Routing | Angular Router con guards funcionales |

---

## Requisitos previos

- **Node.js** ≥ 20
- **Angular CLI** ≥ 21 (`npm install -g @angular/cli`)
- Backend de Lumina BI corriendo (ver `backend/README.md`)

---

## Instalación y puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm start
```

La app queda disponible en `http://localhost:4200`.

Para generar el bundle de producción:

```bash
npm run build
```

El resultado se genera en `dist/ng-tailadmin/`.

---

## Configuración del entorno

La URL base de la API se define en los archivos de entorno:

| Archivo | Uso | Valor por defecto |
|---------|-----|------------------|
| `src/environments/environment.ts` | Desarrollo | `http://localhost:3000/api` |
| `src/environments/environment.prod.ts` | Producción | `/api` (relativa, asume mismo origen) |

Para apuntar a un backend diferente edita `apiUrl` en el archivo correspondiente antes de compilar.

---

## Rutas de la aplicación

| Ruta | Componente | Guard | Descripción |
|------|-----------|-------|-------------|
| `/` | — | `authGuard` | Redirige a `/ai-bi-chat` |
| `/ai-bi-chat` | `AiBiChatComponent` | `authGuard` | Chatbot BI principal |
| `/profile` | `ProfileComponent` | `authGuard` | Perfil del usuario autenticado |
| `/signin` | `SignInComponent` | `publicGuard` | Inicio de sesión |
| `/signup` | `SignUpComponent` | `publicGuard` | Registro de nuevo usuario |
| `/**` | `NotFoundComponent` | — | Página 404 |

- **`authGuard`** — redirige a `/signin` si no hay sesión activa.
- **`publicGuard`** — redirige a `/` si ya hay sesión iniciada.

---

## Estructura del proyecto

```
src/app/
├── pages/
│   ├── ai-bi-chat/          # Módulo principal del chatbot BI
│   ├── auth-pages/
│   │   ├── sign-in/         # Página de login
│   │   └── sign-up/         # Página de registro
│   └── profile/             # Página de perfil de usuario
├── shared/
│   ├── guards/              # authGuard, publicGuard
│   ├── interceptors/        # JWT interceptor (adjunta Bearer token)
│   ├── layout/              # AppLayout, AuthPageLayout, Sidebar, Header
│   └── services/
│       ├── auth.service.ts          # Login, logout, register, refresh
│       ├── token-storage.service.ts # Gestión de JWT en localStorage
│       ├── profile.service.ts       # Carga y actualización de perfil
│       └── chatbot-bi.service.ts    # Consultas al chatbot (REST + SSE)
└── environments/
    ├── environment.ts        # Desarrollo
    └── environment.prod.ts   # Producción
```

---

## Servicios principales

### `AuthService`
Gestiona el ciclo de autenticación completo:
- `login(username, password)` — obtiene JWT y persiste sesión
- `logout()` — cierra sesión en backend y limpia almacenamiento local (siempre, incluso si el backend falla)
- `register(data)` — registra un nuevo usuario vía `POST /api/auth/signup`
- `refresh()` — renueva el token JWT antes de que expire

### `TokenStorageService`
Persiste y lee la sesión desde `localStorage`:
- Token JWT, código de sesión y datos básicos del usuario (`firstName`, `firstLastname`, `roles`)
- `isAuthenticated()` — verifica token presente y no expirado (decodifica `exp` del payload)

### `ChatbotBiService`
Comunica con el API del chatbot:
- Consultas estándar (`POST /api/chatbot/query`) — respuesta JSON completa
- Streaming (`POST /api/chatbot/query-stream`) — eventos SSE en tiempo real
- Gestión de conversaciones (listar, obtener historial, eliminar)

### `ProfileService`
Carga y actualiza el perfil del usuario autenticado con caché reactivo via `BehaviorSubject`.
