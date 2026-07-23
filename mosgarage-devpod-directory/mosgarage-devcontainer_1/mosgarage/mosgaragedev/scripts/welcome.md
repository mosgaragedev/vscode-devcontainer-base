# 🏠 Welcome to mosgarage · home base

This is your unified cloud development environment, running entirely inside Docker.

## Services

| Service | URL | Notes |
|---|---|---|
| **code-server** | `http://localhost:8080` | VS Code in your browser |
| **Node Server** | `http://localhost:3000` | HTTP + WebSocket hub |
| **API Server** | `http://localhost:4000` | REST API (v1) |

## API Quick Reference

```bash
# Health check
curl http://localhost:4000/api/v1/health

# System info (requires API_KEY if set)
curl http://localhost:4000/api/v1/system

# Store a value
curl -X POST http://localhost:4000/api/v1/store/mykey \
  -H "Content-Type: application/json" \
  -d '{"value": "hello mosgarage"}'

# Retrieve it
curl http://localhost:4000/api/v1/store/mykey
```

## WebSocket

```js
const ws = new WebSocket("ws://localhost:3000/ws");
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({ type: "broadcast", payload: "hello!" }));
```

## Logs

```bash
tail -f /var/log/mosgarage/code-server.log
tail -f /var/log/mosgarage/node-server.log
tail -f /var/log/mosgarage/api-server.log
```

---
*mosgarage/mosgarage — built with ❤️*
