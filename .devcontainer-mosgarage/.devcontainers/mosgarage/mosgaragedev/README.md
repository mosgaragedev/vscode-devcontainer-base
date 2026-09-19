# mosgarage/mosgarage · Home Base Docker Image

> Unified cloud dev environment: **code-server** + **Node server** + **REST API** — one container, three ports.

```
docker pull docker.io/mosgarage/mosgarage:latest
```

---

## 🗂 Project Structure

```
mosgarage/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .dockerignore
├── config/
│   ├── code-server-config.yaml   # VS Code browser config
│   ├── supervisord.conf          # Process manager
│   └── ecosystem.config.js       # PM2 config
├── server/                       # Node.js HTTP + WebSocket server (port 3000)
│   ├── index.js
│   └── routes/
│       ├── home.js
│       └── status.js
├── api/                          # Express REST API (port 4000)
│   ├── index.js
│   ├── routes/
│   │   ├── info.js
│   │   ├── health.js
│   │   ├── system.js
│   │   └── storage.js
│   └── middleware/
│       ├── auth.js
│       └── logger.js
└── scripts/
    ├── startup.sh                # Container entrypoint
    ├── build-push.sh             # Build & push to Docker Hub
    ├── run.sh                    # Quick run without Compose
    └── welcome.md                # Workspace landing doc
```

---

## 🚀 Quick Start

### Option A — Docker Compose (recommended)

```bash
cp .env.example .env
# Edit .env — change CODE_SERVER_PASSWORD at minimum!
docker compose up -d
docker compose logs -f
```

### Option B — Single docker run

```bash
docker run -d \
  --name mosgarage \
  --restart unless-stopped \
  -p 8080:8080 \
  -p 3000:3000 \
  -p 4000:4000 \
  -e CODE_SERVER_PASSWORD=yourpassword \
  -v mosgarage-workspace:/app/workspace \
  docker.io/mosgarage/mosgarage:latest
```

### Option C — Quick run script

```bash
chmod +x scripts/run.sh
CODE_SERVER_PASSWORD=yourpassword ./scripts/run.sh
```

---

## 🌐 Ports

| Port | Service | Description |
|------|---------|-------------|
| **8080** | code-server | VS Code in browser |
| **3000** | node-server | HTTP server + WebSocket hub |
| **4000** | api-server  | REST API (v1) |

---

## 🔌 API Reference

### Public

```bash
GET  /                      # API info + endpoint list
GET  /api/v1/health         # Health check
```

### Protected (set API_KEY env to enable)

```bash
GET    /api/v1/system           # System + process stats
GET    /api/v1/system/env       # Safe env variable dump
GET    /api/v1/store            # List all stored keys
GET    /api/v1/store/:key       # Get a stored value
POST   /api/v1/store/:key       # Set a value { "value": ... }
DELETE /api/v1/store/:key       # Delete a key
```

**Auth:** `Authorization: Bearer <API_KEY>` or `X-API-Key: <API_KEY>`

---

## 🔌 WebSocket

Connect to `ws://localhost:3000/ws`:

```js
const ws = new WebSocket("ws://localhost:3000/ws");

ws.onmessage = (e) => console.log(JSON.parse(e.data));

// Broadcast to all connected clients
ws.send(JSON.stringify({ type: "broadcast", payload: "hello everyone" }));
```

Message types: `welcome` · `ping` · `ack` · `broadcast`

---

## 🏗 Build & Push

```bash
chmod +x scripts/build-push.sh

# Push as latest
./scripts/build-push.sh

# Push with version tag
./scripts/build-push.sh 1.2.0
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CODE_SERVER_PASSWORD` | `mosgarage` | code-server login password |
| `CODE_SERVER_PORT` | `8080` | code-server bind port |
| `NODE_SERVER_PORT` | `3000` | node-server bind port |
| `API_PORT` | `4000` | api-server bind port |
| `API_KEY` | _(empty)_ | REST API key (blank = open) |
| `NODE_ENV` | `production` | Node environment |

---

## 🛠 Useful Commands

```bash
# Shell into container
docker exec -it mosgarage bash

# View all logs
docker exec mosgarage tail -f /var/log/mosgarage/code-server.log
docker exec mosgarage tail -f /var/log/mosgarage/node-server.log
docker exec mosgarage tail -f /var/log/mosgarage/api-server.log

# Supervisor status
docker exec mosgarage supervisorctl status

# Restart a service
docker exec mosgarage supervisorctl restart node-server
docker exec mosgarage supervisorctl restart api-server
docker exec mosgarage supervisorctl restart code-server
```
