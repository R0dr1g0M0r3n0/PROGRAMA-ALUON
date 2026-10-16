#!/bin/bash
# ============================================================
# release-dev2.sh
# Build → Push Docker Hub → Deploy en servidor remoto.
# Todo en un solo comando desde tu Mac.
#
# Uso: ./scripts/release-dev2.sh [remote_host] [remote_user]
# Ejemplo: ./scripts/release-dev2.sh 192.168.99.14 root
# ============================================================
set -euo pipefail

# ── Configuración ────────────────────────────────────────────
REMOTE_HOST="${1:-192.168.99.14}"
REMOTE_USER="${2:-root}"
BACKEND_IMAGE="r0dr1g0m0r3n0/aluon-saas-backend:dev2"
FRONTEND_IMAGE="r0dr1g0m0r3n0/aluon-saas-frontend:dev2"
APP_DIR="/opt/aluon"
DB_NAME="aluonbbdd"
DB_USER="aluon"
DB_PASSWORD="aluon"
DB_PORT="3000"
BACKEND_PORT="8080"
FRONTEND_PORT="5173"

REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/infra/portainer-dev2.yml"
ENV_FILE="${PROJECT_ROOT}/infra/.env.dev2"

# ── Colores ──────────────────────────────────────────────────
GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'
step() { echo -e "\n${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  RELEASE DEV2 → ${REMOTE_HOST}         ${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo "  Frontend:  http://${REMOTE_HOST}:${FRONTEND_PORT}"
echo "  Backend:   http://${REMOTE_HOST}:${BACKEND_PORT}"
echo "  DB:        ${REMOTE_HOST}:${DB_PORT}/${DB_NAME}"

# ─────────────────────────────────────────────────────────────
# FASE 1 — BUILD
# ─────────────────────────────────────────────────────────────
step "FASE 1/3 — Build imágenes Docker"

echo "  📦 Backend  → $BACKEND_IMAGE"
docker build --platform linux/amd64 -t "$BACKEND_IMAGE" "$PROJECT_ROOT/backend"
ok "Backend construido"

echo "  📦 Frontend → $FRONTEND_IMAGE"
docker build --platform linux/amd64 -t "$FRONTEND_IMAGE" "$PROJECT_ROOT/frontend"
ok "Frontend construido"

# ─────────────────────────────────────────────────────────────
# FASE 2 — PUSH
# ─────────────────────────────────────────────────────────────
step "FASE 2/3 — Push a Docker Hub"

docker push "$BACKEND_IMAGE"
docker push "$FRONTEND_IMAGE"
ok "Imágenes subidas a Docker Hub"

# ─────────────────────────────────────────────────────────────
# FASE 3 — DEPLOY
# ─────────────────────────────────────────────────────────────
step "FASE 3/3 — Deploy en $REMOTE"

echo "  📤 Copiando configuración al servidor..."
ssh "${REMOTE}" "mkdir -p ${APP_DIR}"
scp "${COMPOSE_FILE}" "${REMOTE}:${APP_DIR}/docker-compose.yml"
scp "${ENV_FILE}"     "${REMOTE}:${APP_DIR}/.env"

echo "  🐳 Levantando contenedores..."
ssh "${REMOTE}" bash <<DEPLOY
set -e
cd "${APP_DIR}"
docker volume create aluon-pgdata-dev2 2>/dev/null || true
DB_NAME="${DB_NAME}" \
DB_USER="${DB_USER}" \
DB_PASSWORD="${DB_PASSWORD}" \
DB_PORT="${DB_PORT}" \
BACKEND_PORT="${BACKEND_PORT}" \
FRONTEND_PORT="${FRONTEND_PORT}" \
docker compose --env-file .env -f docker-compose.yml up -d --pull always
DEPLOY

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
ok "DEV2 desplegado → http://${REMOTE_HOST}:${FRONTEND_PORT}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
