# Despliegue automático por ramas

El workflow `.github/workflows/deploy.yml` valida cada `push` y despliega según la rama:

| Rama | Entorno GitHub | Etiqueta del runner | Archivo Compose | Archivo de entorno del servidor |
|---|---|---|---|---|
| `DEV2` | `dev2` | `aluon-dev2` | `infra/docker-compose.dev2.yml` | `/etc/aluon/dev2.env` |
| `PREPROD` | `preprod` | `aluon-preprod` | `infra/docker-compose.preprod.yml` | `/etc/aluon/preprod.env` |
| `PRODUCCION` | `production` | `aluon-prod` | `infra/docker-compose.prod.yml` | `/etc/aluon/production.env` |

Cada servidor necesita Docker Engine, Docker Compose v2 y un runner de GitHub Actions instalado con su etiqueta correspondiente. El runner debe tener permiso para usar Docker.

Los archivos `.env` no se suben al repositorio. Se crean manualmente en cada servidor y contienen la configuración y los secretos de ese entorno. El entorno `production` debe configurarse en GitHub con revisión obligatoria si se quiere una aprobación antes de publicar, aunque el workflow queda preparado para desplegar automáticamente cada commit.

El despliegue usa `docker compose up -d --build --remove-orphans`; los volúmenes de PostgreSQL definidos por cada Compose se conservan.
