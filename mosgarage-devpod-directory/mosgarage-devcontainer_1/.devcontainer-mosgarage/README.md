# mosgarage devcontainer

Mixed-stack microservice dev environment. Runs entirely in WSL with no Docker Desktop required.

---

## What's included

| Service | Stack | Port | DB |
|---|---|---|---|
| api-gateway | Node/TS | 3000 | Redis (rate limit cache) |
| auth-service | Node/TS | 3001 | PostgreSQL |
| content-service | Node/TS | 3002 | MongoDB |
| learner-service | Node/TS | 3003 | PostgreSQL + MongoDB |
| notification-service | Node/TS | 3004 | Redis + MongoDB |
| PostgreSQL 16 | — | 5432 | ✓ persistent volume |
| MongoDB 7 | — | 27017 | ✓ persistent volume |
| Redis 7 | — | 6379 | ✓ persistent AOF |
| Mongo Express | — | 8081 | web UI |
| Redis Commander | — | 8082 | web UI |

---

## First-time WSL setup (no Docker Desktop)

```bash
# In WSL terminal:
bash scripts/setup-wsl-docker.sh
newgrp docker
```

That's it. No Docker Desktop needed — the script installs Docker Engine natively in WSL and fixes the credsStore config that was causing your issues.

---

## Open the devcontainer

### Via VS Code (recommended)
```
code .
# VS Code shows: "Reopen in Container" → click it
```

### Via CLI
```bash
devcontainer open .
```

---

## Running services

```bash
# Start just the databases (always running in devcontainer)
# — they start automatically with the workspace container

# Start all microservices
mg-up

# Start one specific service
docker compose -f .devcontainer/docker-compose.yml up auth-service

# View all logs
mg-logs

# View one service's logs
mg-logs auth-service

# Check what's running
mg-ps
```

---

## Database access

```bash
# From inside the devcontainer terminal:
pgcli        # → PostgreSQL
mongocli     # → MongoDB shell
rcli         # → Redis CLI

# Connection strings (also set as env vars):
# DATABASE_URL=postgresql://mosgarage:mosgarage@postgres:5432/mosgarage
# MONGODB_URL=mongodb://mosgarage:mosgarage@mongodb:27017/mosgarage
# REDIS_URL=redis://:mosgarage@redis:6379
```

---

## Adding a new microservice

1. Create `services/my-service/`
2. Copy `Dockerfile.dev` from `services/api-gateway/`
3. Add it to `.devcontainer/docker-compose.yml` under a new service block with `profiles: ["services"]`
4. Add its port to `devcontainer.json` `forwardPorts`
5. Rebuild: **Dev Containers: Rebuild Container**

---

## Data persistence

All three databases use **named Docker volumes** — your data survives:
- Container rebuilds
- `docker compose down` (use `down -v` only if you want to wipe)
- WSL restarts
- VS Code restarts

To reset a database:
```bash
docker compose -f .devcontainer/docker-compose.yml down -v postgres   # wipe postgres
docker compose -f .devcontainer/docker-compose.yml up postgres        # fresh start
```

---

## Enable systemd in WSL (recommended — makes Docker auto-start)

```powershell
# In PowerShell:
wsl --shutdown
```
```bash
# Back in WSL, edit /etc/wsl.conf:
echo -e '[boot]\nsystemd=true' | sudo tee -a /etc/wsl.conf
```
```powershell
# PowerShell again:
wsl --shutdown
# Reopen WSL — Docker will now start automatically
```
