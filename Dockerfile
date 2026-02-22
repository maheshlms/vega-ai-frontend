# ============================================================
# Stage 1 — Build
#   Uses Node to install deps and run `vite build`.
#   All VITE_* vars are declared as ARGs and promoted to ENV
#   so Vite can bake them into the compiled JS bundle.
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Declare every VITE_* build-time variable
ARG VITE_BACKEND_URL
ARG VITE_AUDIT_SERVICE_URL
ARG VITE_TARGET_SYSTEMS_URL
ARG VITE_LLM_RUNTIME_URL
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ARG VITE_LIVEAVATAR_API_KEY
ARG VITE_HEYGEN_API_KEY
ARG VITE_ANTHROPIC_API_KEY

# Expose them as environment variables so Vite picks them up
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_AUDIT_SERVICE_URL=$VITE_AUDIT_SERVICE_URL
ENV VITE_TARGET_SYSTEMS_URL=$VITE_TARGET_SYSTEMS_URL
ENV VITE_LLM_RUNTIME_URL=$VITE_LLM_RUNTIME_URL
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE
ENV VITE_LIVEAVATAR_API_KEY=$VITE_LIVEAVATAR_API_KEY
ENV VITE_HEYGEN_API_KEY=$VITE_HEYGEN_API_KEY
ENV VITE_ANTHROPIC_API_KEY=$VITE_ANTHROPIC_API_KEY

# Install dependencies (uses package-lock.json for reproducible installs)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ============================================================
# Stage 2 — Serve
#   Copies only the compiled `dist/` folder into a minimal
#   Nginx image (~50 MB vs ~600 MB for Node).
# ============================================================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
