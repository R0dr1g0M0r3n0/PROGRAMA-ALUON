#!/bin/bash
# ============================================================
# release-prod.sh
# Build → Push Docker Hub → Deploy en servidor remoto.
# Todo en un solo comando desde tu Mac.
#
# Uso: ./scripts/release-prod.sh [remote_host] [remote_user]
# Ejemplo: ./scripts/release-prod.sh 192.168.99.14 root
# ============================================================
set -euo pipefail

# ── Configuración ────────────────────────────────────────────
REMOTE_HOST="${1:-192.168.99.14}"
REMOTE_USER="${2:-root}"
BACKEND_IMAGE="r0dr1g0m0r3n0/aluon-saas-backend:prod"
FRONTEND_IMAGE="r0dr1g0m0r3n0/aluon-saas-frontend:prod"
APP_DIR="/opt/aluon-prod"
DB_NAME="aluonbbddprod"
DB_USER="aluon"
DB_PASSWORD="aluon"
DB_PORT="3000"
BACKEND_PORT="8082"
FRONTEND_PORT="5175"

REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/infra/portainer-prod.yml"
ENV_FILE="${PROJECT_ROOT}/infra/.env.prod"

# ── Colores ──────────────────────────────────────────────────
GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'
step() { echo -e "\n${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  RELEASE PROD → ${REMOTE_HOST}         ${NC}"
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

DB_NAME="${DB_NAME}" \
DB_USER="${DB_USER}" \
DB_PASSWORD="${DB_PASSWORD}" \
DB_PORT="${DB_PORT}" \
BACKEND_PORT="${BACKEND_PORT}" \
FRONTEND_PORT="${FRONTEND_PORT}" \
docker compose --env-file .env -f docker-compose.yml up -d --pull always

# Asegurar que la base de datos de PROD existe en el contenedor compartido de DEV2
# NOTA: Utilizamos aluon-saas-postgres-dev2 como contenedor anfitrión, sin el -saas-,
# ya que en DEV2 revertiste el nombre de ese contenedor a aluon-saas-postgres-dev2
echo "  🗄️ Asegurando que la BBDD ${DB_NAME} exista..."
docker exec aluon-saas-postgres-dev2 psql -U aluon -d aluonbbdd -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || docker exec aluon-saas-postgres-dev2 psql -U aluon -d aluonbbdd -c "CREATE DATABASE ${DB_NAME}" || true
DEPLOY

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
ok "PROD desplegado → http://${REMOTE_HOST}:${FRONTEND_PORT}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
