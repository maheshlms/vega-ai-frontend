# Frontend — Vega AI Agent Factory

React 19 + Vite + TypeScript single-page application. Communicates with the backend at `localhost:8000` and the audit service at `localhost:8002`.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| npm | 10+ |
| Docker Desktop | 24+ (for containerised run) |

---

## Environment Variables (`Frontend/.env`)

All `VITE_*` variables are **baked into the JS bundle at build time** by Vite. Edit `.env` before running or before building the Docker image.

```dotenv
# ── Auth0 ──────────────────────────────────────────────────────────────────────
# Must match the values in Backend/.env
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_spa_client_id
VITE_AUTH0_AUDIENCE=https://backend-api

# ── Backend API URLs ───────────────────────────────────────────────────────────
# The browser calls these directly — localhost is correct even when the
# backend runs in Docker (its ports are mapped to the host).
VITE_BACKEND_URL=http://localhost:8000
VITE_AUDIT_SERVICE_URL=http://localhost:8002
VITE_TARGET_SYSTEMS_URL=http://localhost:8000
VITE_LLM_RUNTIME_URL=http://localhost:8000

# ── Optional integrations ──────────────────────────────────────────────────────
VITE_LIVEAVATAR_API_KEY=
VITE_HEYGEN_API_KEY=
VITE_ANTHROPIC_API_KEY=
```

### Auth0 setup
1. In the Auth0 Dashboard create a **Single Page Application**.
2. Add the following to **Allowed Callback URLs**, **Allowed Logout URLs**, and **Allowed Web Origins**:
   - `http://localhost:3000` (Docker / production)
   - `http://localhost:5173` (local dev)
3. Create an **API** with identifier `https://backend-api`.
4. Copy the **Domain** and **Client ID** into `.env`.

---

## Running Locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # Production build → dist/
npm run preview    # Serve the production build locally
npm run lint       # ESLint
```

---

## Running with Docker

Builds a multi-stage image (Node builder → Nginx) and serves on port **3000**.

```bash
# From the Frontend directory
docker compose up --build -d

# Stop
docker compose down
```

> If you change `.env`, you must rebuild: `docker compose up --build -d`

The final image is ~50 MB because only the compiled `dist/` files are copied into Nginx — Node and `node_modules` are discarded after the build stage.

---

## Full Stack (all services)

See the root [`README.md`](../README.md). From the repo root:

```bash
docker compose up --build -d    # starts frontend + all backend services
docker compose down
```

---

## Project Structure

```
Frontend/
├── Dockerfile              # Multi-stage: Node build → Nginx serve
├── nginx.conf              # SPA routing + gzip + long-term caching
├── docker-compose.yml
├── .env                    # VITE_* build-time variables
├── .dockerignore
├── vite.config.js          # Vite config (host: true, port: 5173)
├── tsconfig.json
└── src/
    ├── main.tsx            # Auth0Provider setup, app entry point
    ├── App.tsx             # React Router layout and routes
    ├── components/         # Shared UI — Btn, InputField, ChatBox, SearchBox, …
    ├── effects/            # Visual effects — FloatingDots, GlassBlobs, MouseMove
    ├── features/           # Page-level components
    │   ├── LoginPage.tsx
    │   ├── AgentChat.tsx         # Main agent chat interface
    │   ├── Agents.tsx            # Agent management
    │   ├── IntegrationsPage.tsx  # Target system integrations
    │   ├── AuditLogs.tsx         # Audit log viewer
    │   ├── Settings.tsx          # Admin settings
    │   └── …
    ├── layouts/            # TopBar, Sidebar
    ├── routes/             # Route definitions
    ├── state/              # Global state
    ├── styles/             # Global CSS
    └── utils/
        ├── api.ts          # All backend API calls
        ├── auth.ts         # Auth0 token helpers
        └── UserContext.tsx # Global user context provider
```

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `react` 19 | UI framework |
| `react-router-dom` 7 | Client-side routing |
| `@auth0/auth0-react` | Auth0 authentication |
| `vite` | Build tool and dev server |
| `@tailwindcss/vite` | Utility-first CSS |
| `recharts` | Charts and data visualisation |
| `react-toastify` | Toast notifications |
| `react-icons` / `remixicon` | Icon libraries |
