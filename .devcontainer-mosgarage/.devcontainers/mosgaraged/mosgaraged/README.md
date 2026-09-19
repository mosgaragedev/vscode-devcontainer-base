# mosgaraged

> **MosGarage Workspace Daemon** — cross-platform workspace application orchestrator.

`mosgaraged` is the core background daemon for the mosgarage stack. It manages the lifecycle of **workspace apps** (web servers, databases, containers, build tools — anything) across Linux, macOS, and Windows via a unified REST + WebSocket API.

---

## Architecture

```
mosgaraged/
├── src/
│   ├── daemon.js               ← Main entry point (wires everything)
│   ├── config/index.js         ← Config loader (file + env vars + defaults)
│   ├── utils/logger.js         ← Structured logging (winston + daily rotation)
│   ├── api/server.js           ← REST API + WebSocket server (Express)
│   └── workspaceapps/
│       └── manager.js          ← App lifecycle engine (process + Docker)
├── workspaceapps/
│   └── definitions/            ← Drop your app definition JSON/YAML files here
├── scripts/
│   ├── install-service.js      ← Cross-platform OS service installer
│   └── uninstall-service.js
├── bin/mosgaraged              ← CLI (`mgd`)
├── mosgaraged.config.json      ← Main config
└── logs/                       ← Log output (auto-created)
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Edit mosgaraged.config.json

# 3. Start the daemon
npm start
# or
node src/daemon.js

# 4. In another terminal, use the CLI
node bin/mosgaraged status
node bin/mosgaraged list
```

Or link globally:

```bash
npm link
mgd status
mgd list
mgd start <app-id>
```

---

## Install as a System Service

Runs on boot, auto-restarts on crash.

```bash
node scripts/install-service.js
```

| Platform | Method | Logs |
|----------|--------|------|
| Linux | systemd | `journalctl -u mosgaraged -f` |
| macOS | launchd | `tail -f logs/mosgaraged.out.log` |
| Windows | NSSM / sc.exe | `logs/mosgaraged.out.log` |

To remove:
```bash
node scripts/uninstall-service.js
```

---

## Workspace App Definitions

Drop a `.json` or `.yaml` file into `workspaceapps/definitions/`. The daemon hot-reloads on `SIGHUP` (Linux/macOS) or restart.

### Process app

```json
{
  "id": "api-server",
  "name": "API Server",
  "type": "process",
  "autoStart": true,
  "command": "node",
  "args": ["index.js"],
  "cwd": "./apps/api",
  "env": { "PORT": "3000" },
  "restartPolicy": "on-failure",
  "maxRestarts": 5,
  "healthcheck": {
    "type": "http",
    "port": 3000,
    "path": "/health",
    "expectedStatus": 200
  }
}
```

### Docker container app

```json
{
  "id": "redis",
  "name": "Redis Cache",
  "type": "docker",
  "autoStart": true,
  "image": "redis:7-alpine",
  "containerName": "mgd-redis",
  "ports": ["6379:6379"],
  "restartPolicy": "always",
  "healthcheck": { "type": "docker" }
}
```

### Start an existing named container

```json
{
  "id": "my-db",
  "name": "My Database",
  "type": "docker",
  "container": "my-existing-container-name"
}
```

#### Definition fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | **required** | Unique identifier |
| `name` | string | **required** | Display name |
| `type` | `process` \| `docker` | **required** | App type |
| `autoStart` | boolean | `true` | Start on daemon boot |
| `command` | string | — | Process command (process type) |
| `args` | string[] | `[]` | Command arguments |
| `cwd` | string | daemon dir | Working directory |
| `env` | object | `{}` | Environment variables |
| `image` | string | — | Docker image (docker type) |
| `container` | string | — | Existing container name |
| `containerName` | string | `mgd-{id}` | Name for new container |
| `ports` | string[] | `[]` | Port mappings `host:container` |
| `volumes` | string[] | `[]` | Volume mounts |
| `restartPolicy` | `always` \| `on-failure` \| `never` | config default | When to restart |
| `maxRestarts` | number | `5` | Max restart attempts |
| `healthcheck` | object | — | Health check config (see below) |

#### Healthcheck types

```json
{ "type": "http",    "port": 3000, "path": "/health", "expectedStatus": 200, "timeoutMs": 5000 }
{ "type": "process"  }
{ "type": "docker"   }
```

---

## REST API

Base URL: `http://127.0.0.1:4747/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/status` | Daemon status, uptime, memory |
| `GET` | `/apps` | List all apps |
| `GET` | `/apps/definitions` | List loaded definitions |
| `GET` | `/apps/:id` | Get single app |
| `POST` | `/apps/:id/start` | Start app |
| `POST` | `/apps/:id/stop` | Stop app |
| `POST` | `/apps/:id/restart` | Restart app |
| `GET` | `/apps/:id/health` | Check app health |
| `GET` | `/config` | Show active config |

### WebSocket

| Path | Description |
|------|-------------|
| `ws://127.0.0.1:4747/ws/logs?app=<id>` | Stream stdout/stderr (omit `?app` for all) |
| `ws://127.0.0.1:4747/ws/events` | App lifecycle events |

---

## CLI (`mgd`)

```
mgd status          Show daemon status
mgd list (ls)       List all workspace apps
mgd start <id>      Start an app
mgd stop <id>       Stop an app
mgd restart <id>    Restart an app
mgd health <id>     Check app health
```

---

## Configuration

`mosgaraged.config.json` (auto-merged with env vars prefixed `MGD_`):

```json
{
  "daemon":   { "port": 4747, "host": "127.0.0.1", "logLevel": "info" },
  "docker":   { "enabled": true, "socketPath": "/var/run/docker.sock" },
  "healthcheck": { "enabled": true, "intervalSeconds": 30 },
  "workspaceapps": { "autoStartOnBoot": true, "restartPolicy": "on-failure" },
  "api":      { "cors": true, "auth": { "enabled": false } }
}
```

Env override examples:
```bash
MGD_DAEMON_PORT=9000
MGD_DAEMON_LOGLEVEL=debug
MGD_API_AUTH_ENABLED=true
MGD_HEALTHCHECK_INTERVALSECONDS=60
```

---

## Platform Notes

| Feature | Linux | macOS | Windows |
|---------|-------|-------|---------|
| Process apps | ✓ | ✓ | ✓ (via cmd) |
| Docker apps | ✓ | ✓ | ✓ (named pipe) |
| systemd service | ✓ | — | — |
| launchd service | — | ✓ | — |
| Windows Service | — | — | ✓ (NSSM/sc) |
| SIGHUP reload | ✓ | ✓ | — (restart) |
| Log rotation | ✓ | ✓ | ✓ |

---

## License

MIT — mosgarage
