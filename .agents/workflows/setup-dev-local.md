---
description: Configuración del entorno DEV2 en local
---

# 🏠 Configurar Entorno de Desarrollo Local (Réplica de DEV2)

Este workflow te permite replicar el entorno **DEV2** en tu máquina local para desarrollar, probar múltiples cambios y luego subirlos todos juntos a DEV2.

## 🎯 Arquitectura: Local + DEV2 Compartiendo Base de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                     TU MÁQUINA LOCAL                        │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │  WildFly Local   │          │  Frontend Local  │        │
│  │  Puerto: 8080    │          │  Puerto: 5173    │        │
│  └────────┬─────────┘          └──────────────────┘        │
│           │                                                  │
│           │ DB Connection                                    │
└───────────┼──────────────────────────────────────────────────┘
            │
            │ TCP Connection: 192.168.100.205:5432
            ▼
┌─────────────────────────────────────────────────────────────┐
│            SERVIDOR DEV2 (192.168.100.x)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL en Docker (192.168.100.205:5432)          │  │
│  │  Base de Datos: gestion_fayos_prod                   │  │
│  │  ✅ COMPARTIDA entre Local y DEV2                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │  WildFly DEV2    │          │  Frontend DEV2   │        │
│  │  Puerto: 80      │          │  Puerto: 5173    │        │
│  └──────────────────┘          └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

**⚠️ IMPORTANTE**: Local y DEV2 comparten la **misma base de datos PostgreSQL**. Cualquier cambio que hagas en local afecta a DEV2 inmediatamente.

## 📋 Prerrequisitos

- Docker Desktop instalado y corriendo
- Node.js 18+ y npm
- Java 17+ y Maven
- Git configurado con acceso al repositorio
- **Conectividad de red a `192.168.100.205:5432`** (base de datos DEV2)

## 🚀 Setup Inicial (Solo Primera Vez)

### 1. Verificar Conexión a la Base de Datos DEV2

Primero, verifica que puedes conectarte a la base de datos compartida:

```bash
# Probar conexión con psql (si lo tienes instalado)
psql -h 192.168.100.205 -p 5432 -U postgres -d gestion_fayos_prod

# O con Docker
docker run --rm -it postgres:15-alpine psql -h 192.168.100.205 -p 5432 -U postgres -d gestion_fayos_prod
```

**Credenciales:**
- Host: `192.168.100.205`
- Puerto: `5432`
- Usuario: `postgres`
- Password: `password`
- Base de datos: `gestion_fayos_prod`

### 2. Crear Archivo de Configuración Local

Crea un archivo `.env.local` en la raíz del proyecto (NO lo commitees):

```bash
# .env.local - Configuración para desarrollo local
DB_HOST=192.168.100.205
DB_PORT=5432
DB_NAME=gestion_fayos_prod
DB_USER=postgres
DB_PASSWORD=password
ENVIRONMENT=dev
SUPABASE_JWT_SECRET=this-is-a-default-secret-key-for-local-development-only-12345
```

### 3. Estructura del Proyecto

```
gas-stock-project/
├── .env                          # Credenciales de todos los entornos (COMMITEAR)
├── .env.local                    # Tu config local (NO COMMITEAR)
├── local_manager.sh              # 🎯 Script principal de desarrollo
├── infra/
│   ├── docker-compose.yml        # Orquestación completa
│   ├── docker-compose.local.yml  # ⚡ Nuevo: Config específica para local
│   ├── Dockerfile.wildfly        # Backend (WildFly + Java)
│   └── Dockerfile.frontend       # Frontend (Nginx + React)
└── modules/
    ├── gas-shell/                # Frontend principal (Puerto 5173)
    ├── gas-crm/                  # Frontend CRM (Puerto 5174)
    ├── gas-admin/                # Backend módulo admin
    ├── gas-inventory/            # Backend módulo inventario
    └── ...                       # Otros módulos backend
```

## 🎮 Opción 1: Desarrollo Frontend + Backend Local (RECOMENDADO)

Esta es la forma más rápida de desarrollar:

### A. Compilar Backend (Primera vez o después de cambios en Java)

```bash
cd modules
mvn clean install -DskipTests -Dskip.frontend=true
cd ..
```

### B. Levantar Backend Conectado a BBDD DEV2

```bash
docker run --rm -it \
  --name wildfly-local \
  -p 8080:8080 \
  -p 9990:9990 \
  -e DB_HOST=192.168.100.205 \
  -e DB_PORT=5432 \
  -e DB_NAME=gestion_fayos_prod \
  -e DB_USER=postgres \
  -e DB_PASSWORD=password \
  -e ENVIRONMENT=dev \
  -e "JAVA_OPTS=-Xms512m -Xmx2048m -XX:MetaspaceSize=512M -XX:MaxMetaspaceSize=1024m" \
  -v $(pwd)/modules/gas-tpv/target/gas-tpv.war:/opt/jboss/wildfly/standalone/deployments/gas-tpv.war \
  -v $(pwd)/modules/gas-invoicing/target/gas-invoicing.war:/opt/jboss/wildfly/standalone/deployments/gas-invoicing.war \
  -v $(pwd)/modules/gas-inventory/target/gas-inventory.war:/opt/jboss/wildfly/standalone/deployments/gas-inventory.war \
  -v $(pwd)/modules/gas-logistics/target/gas-logistics.war:/opt/jboss/wildfly/standalone/deployments/gas-logistics.war \
  -v $(pwd)/modules/gas-crm/target/gas-crm.war:/opt/jboss/wildfly/standalone/deployments/gas-crm.war \
  -v $(pwd)/modules/gas-admin/target/gas-admin.war:/opt/jboss/wildfly/standalone/deployments/gas-admin.war \
  -v $(pwd)/modules/gas-corporate/target/gas-corporate.war:/opt/jboss/wildfly/standalone/deployments/gas-corporate.war \
  -v $(pwd)/modules/gas-shell/target/ROOT.war:/opt/jboss/wildfly/standalone/deployments/ROOT.war \
  quay.io/wildfly/wildfly:30.0.1.Final-jdk17
```

El backend estará en: http://localhost:8080

### C. Levantar Frontend en Modo Desarrollo

En otra terminal:

```bash
cd modules/gas-shell/src/main/frontend
npm install  # Solo primera vez
npm run dev
```

El frontend estará en: http://localhost:5173

### D. (Opcional) Levantar Frontend CRM

En otra terminal más:

```bash
cd modules/gas-crm/src/main/frontend
npm install  # Solo primera vez
npm run dev
```

El frontend CRM estará en: http://localhost:5174

## 🎮 Opción 2: Usar Docker Compose Local (Simplificado)

Voy a crear un `docker-compose.local.yml` específico para desarrollo local que:
- **NO levanta** PostgreSQL (usa la de DEV2)
- Levanta WildFly con los volúmenes montados
- Configura las variables de entorno correctamente

**Ver sección "Crear docker-compose.local.yml" más abajo**

## 🔄 Flujo de Trabajo Típico

### 1. Iniciar Día de Desarrollo

```bash
# Terminal 1: Backend
docker run --rm -it --name wildfly-local -p 8080:8080 -p 9990:9990 \
  -e DB_HOST=192.168.100.205 -e DB_PORT=5432 -e DB_NAME=gestion_fayos_prod \
  -e DB_USER=postgres -e DB_PASSWORD=password \
  -v $(pwd)/modules/gas-shell/target/ROOT.war:/opt/jboss/wildfly/standalone/deployments/ROOT.war \
  # ... resto de volúmenes ...
  quay.io/wildfly/wildfly:30.0.1.Final-jdk17

# Terminal 2: Frontend
cd modules/gas-shell/src/main/frontend && npm run dev
```

### 2. Hacer Cambios en el Código

**Para cambios en Frontend (React/Vite):**
- Los cambios se reflejan **instantáneamente** (Hot Module Replacement)
- Edita archivos en `modules/gas-shell/src/main/frontend/src/`
- Guarda y el navegador se recarga automáticamente

**Para cambios en Backend (Java):**
- Edita archivos en `modules/gas-*/src/main/java/`
- Recompila el módulo específico:
  ```bash
  cd modules/gas-admin  # o el módulo que hayas editado
  mvn clean install -DskipTests
  cd ../..
  ```
- WildFly detectará el nuevo WAR y lo redesplegará automáticamente (hot-deploy)

**Para cambios en Base de Datos:**
⚠️ **CUIDADO**: Estás trabajando en la BBDD de DEV2, cualquier cambio afecta a todos.

- Conecta con DBeaver/pgAdmin a `192.168.100.205:5432`
- Usuario: `postgres`, Password: `password`, DB: `gestion_fayos_prod`
- **Mejor práctica**: Usa migraciones de Flyway en `src/main/resources/db/migration/`

### 3. Probar Cambios en Local

- Navega a http://localhost:5173
- Prueba tu funcionalidad
- Verifica logs del backend en la terminal donde corre WildFly
- **Verifica que no hayas roto nada en DEV2** (comparten la misma DB)

### 4. Guardar Progreso en Git (Desarrollo Iterativo)

Trabaja en una rama local para no contaminar DEV2:

```bash
# Crear rama de trabajo
git checkout -b feature/mi-nueva-funcionalidad

# Hacer commits frecuentes
git add .
git commit -m "feat: implementar X funcionalidad"

# Seguir desarrollando...
git add .
git commit -m "fix: corregir bug en Y"
```

### 5. Cuando Tengas Todo Listo y Probado

**Opción A: Merge directo a DEV2 (Menos recomendado)**
```bash
git checkout DEV2
git pull origin DEV2
git merge feature/mi-nueva-funcionalidad
git push origin DEV2  # Jenkins se encarga del despliegue
```

**Opción B: Subir cambios específicos a DEV2 (Más control)**
```bash
# Asegurarte de estar en DEV2
git checkout DEV2
git pull origin DEV2

# Cherry-pick solo los commits que quieres
git cherry-pick <commit-hash-1>
git cherry-pick <commit-hash-2>

# O aplicar cambios manualmente
git add -A
git commit -m "feat: conjunto de mejoras probadas en local"
git push origin DEV2  # Jenkins despliega
```

## 🎯 Diferencias entre Local y DEV2

| Aspecto | Local | DEV2 |
|---------|-------|------|
| **Base de Datos** | ✅ Misma que DEV2 (`192.168.100.205:5432`) | ✅ PostgreSQL en Docker |
| **Backend** | WildFly en Docker (puerto 8080) | WildFly en Docker (puerto 80 vía 192.168.100.200) |
| **Frontend** | Vite Dev Server (5173, 5174) con HMR | Nginx sirviendo build estático (puerto 5173) |
| **Hot Reload** | ✅ Instantáneo | ❌ Requiere rebuild via Jenkins |
| **Datos** | ⚠️ COMPARTIDOS con DEV2, cuidado | Datos reales |
| **Despliegue** | Manual directo | Automático via Jenkins |

## 🛠️ Comandos Útiles

### Ver Logs de Backend Local
```bash
docker logs -f wildfly-local
```

### Conectar a Base de Datos DEV2
```bash
# Con Docker
docker run --rm -it postgres:15-alpine psql \
  -h 192.168.100.205 -p 5432 -U postgres -d gestion_fayos_prod

# O con psql nativo
psql -h 192.168.100.205 -p 5432 -U postgres -d gestion_fayos_prod
```

### Compilar Solo un Módulo Específico
```bash
cd modules/gas-inventory
mvn clean install -DskipTests
cd ../..
```

### Rebuild Frontend para Producción (Testing local del build)
```bash
cd modules/gas-shell/src/main/frontend
npm run build
# Los archivos van a dist/

# Probar el build con un servidor local
npx serve dist -p 3000
```

### Parar Backend Local
```bash
docker stop wildfly-local
```

### Ver Contenedores Corriendo
```bash
docker ps
```

## 🐛 Troubleshooting

### Frontend no conecta con Backend
Verifica que el proxy esté configurado en `vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': 'http://localhost:8080'
  }
}
```

### Backend no encuentra la Base de Datos
1. Verifica conectividad:
   ```bash
   ping 192.168.100.205
   telnet 192.168.100.205 5432
   ```
2. Verifica que no haya firewall bloqueando
3. Verifica que el contenedor de PostgreSQL en DEV2 esté corriendo

### Puerto ocupado (8080, 5173, 5174)
Mata el proceso:
```bash
lsof -ti:8080 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Cambios en Java no se reflejan
1. Recompila: `mvn clean install -DskipTests`
2. Verifica logs: `docker logs wildfly-local`
3. Si falla, reinicia WildFly: `docker restart wildfly-local`

### Docker no arranca (Mac)
```bash
sudo ln -sf "$HOME/.docker/run/docker.sock" /var/run/docker.sock
open -a Docker
```

### Error: "Cannot connect to database"
Verifica que estás en la red correcta (VPN, misma red que el servidor DEV2):
```bash
ping 192.168.100.205
```

## ✅ Checklist antes de Subir a DEV2

- [ ] ¿Todos los tests pasan localmente?
- [ ] ¿La aplicación funciona sin errores en http://localhost:5173?
- [ ] ¿Las migraciones de base de datos están incluidas en `src/main/resources/db/migration/`?
- [ ] ¿Los cambios están commiteados con mensajes claros?
- [ ] ¿Has probado la funcionalidad completa (no solo el happy path)?
- [ ] ¿Hay archivos sensibles (.env.local, credentials) en el commit? (NO deben estar)
- [ ] ⚠️ ¿Has verificado que los cambios en la BBDD no rompen DEV2?

## 📝 Notas Importantes

1. **Nunca commitees `.env.local`** - Agrega a `.gitignore` si no está
2. **Usa ramas de feature** para desarrollo, no trabajes directo en DEV2
3. **⚠️ CUIDADO CON LA BASE DE DATOS**: Compartes la misma con DEV2
4. **Hot-Deploy funciona** para Java, HMR para React
5. **No ejecutes migraciones destructivas** sin coordinación con el equipo
6. **Backups antes de cambios grandes** en la BBDD

## 🎓 Flujo Recomendado Completo

```bash
# 1. Crear rama de trabajo
git checkout -b feature/nueva-funcionalidad

# 2. Compilar backend
cd modules && mvn clean install -DskipTests -Dskip.frontend=true && cd ..

# 3. Arrancar backend local (conectado a BBDD DEV2)
docker run --rm -it --name wildfly-local -p 8080:8080 \
  -e DB_HOST=192.168.100.205 -e DB_PORT=5432 -e DB_NAME=gestion_fayos_prod \
  # ... resto de configuración ...

# 4. En otra terminal: arrancar frontend
cd modules/gas-shell/src/main/frontend && npm run dev

# 5. Desarrollar iterativamente
# - Editar código
# - Ver cambios en http://localhost:5173
# - Hacer commits frecuentes

# 6. Cuando esté todo listo
git checkout DEV2
git pull origin DEV2
git merge feature/nueva-funcionalidad

# 7. Resolver conflictos si los hay
git add .
git commit -m "merge: integrar nueva funcionalidad"

# 8. Subir a DEV2
git push origin DEV2

# 9. Jenkins detecta el push y despliega automáticamente
# Monitorea en tu consola Jenkins
```

## 🚀 Crear docker-compose.local.yml (Opcional - Simplifica el proceso)

Puedes crear este archivo para evitar escribir comandos largos:

```yaml
# infra/docker-compose.local.yml
version: '3.8'

services:
  wildfly-local:
    image: quay.io/wildfly/wildfly:30.0.1.Final-jdk17
    container_name: wildfly-local
    ports:
      - "8080:8080"
      - "9990:9990"
    environment:
      - DB_HOST=192.168.100.205
      - DB_PORT=5432
      - DB_NAME=gestion_fayos_prod
      - DB_USER=postgres
      - DB_PASSWORD=password
      - ENVIRONMENT=dev
      - JAVA_OPTS=-Xms512m -Xmx2048m -XX:MetaspaceSize=512M -XX:MaxMetaspaceSize=1024m
    volumes:
      - ../modules/gas-tpv/target/gas-tpv.war:/opt/jboss/wildfly/standalone/deployments/gas-tpv.war
      - ../modules/gas-invoicing/target/gas-invoicing.war:/opt/jboss/wildfly/standalone/deployments/gas-invoicing.war
      - ../modules/gas-inventory/target/gas-inventory.war:/opt/jboss/wildfly/standalone/deployments/gas-inventory.war
      - ../modules/gas-logistics/target/gas-logistics.war:/opt/jboss/wildfly/standalone/deployments/gas-logistics.war
      - ../modules/gas-crm/target/gas-crm.war:/opt/jboss/wildfly/standalone/deployments/gas-crm.war
      - ../modules/gas-admin/target/gas-admin.war:/opt/jboss/wildfly/standalone/deployments/gas-admin.war
      - ../modules/gas-corporate/target/gas-corporate.war:/opt/jboss/wildfly/standalone/deployments/gas-corporate.war
      - ../modules/gas-shell/target/ROOT.war:/opt/jboss/wildfly/standalone/deployments/ROOT.war
```

Luego simplemente:

```bash
docker compose -f infra/docker-compose.local.yml up
```
