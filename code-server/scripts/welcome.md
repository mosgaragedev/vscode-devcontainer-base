# 🏠 Welcome to mosgarage · home base

This is your unified cloud development environment running inside Docker,
with automatic backup and sync to **github.com/mosgarage/mosgaragedev**.

---

## Services

| Service | URL | Notes |
|---|---|---|
| **code-server** | `http://localhost:8080` | VS Code in your browser |
| **Node Server** | `http://localhost:3000` | HTTP + WebSocket hub |
| **API Server** | `http://localhost:4000` | REST API (v1) |
| **GitHub Sync** | Auto-background | Pushes every 15 min |

---

## GitHub Sync

Your workspace is automatically backed up to GitHub.

```bash
# Force an immediate push
git-push-now

# Check sync status
git-status

# Watch the sync log live
tail -f /var/log/mosgarage/git-sync.log
```

The sync daemon:
1. **Pulls** remote changes first (merge, no rebase)
2. **Commits** all local changes with a timestamped message
3. **Pushes** to `origin/main` on github.com/mosgarage/mosgaragedev

---

## API Quick Reference

```bash
# Health check
curl http://localhost:4000/api/v1/health

# System info
curl http://localhost:4000/api/v1/system

# Store a value
curl -X POST http://localhost:4000/api/v1/store/mykey \
  -H "Content-Type: application/json" \
  -d '{"value": "hello mosgarage"}'
```

## WebSocket

```js
const ws = new WebSocket("ws://localhost:3000/ws");
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({ type: "broadcast", payload: "hello!" }));
```

---

*mosgarage/mosgarage — synced to github.com/mosgarage/mosgaragedev*
