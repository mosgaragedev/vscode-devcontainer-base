"use strict";
const http        = require("http");
const express     = require("express");
const helmet      = require("helmet");
const cors        = require("cors");
const morgan      = require("morgan");
const compression = require("compression");
const rateLimit   = require("express-rate-limit");
const { WebSocketServer } = require("ws");
const { v4: uuidv4 } = require("uuid");
const Redis       = require("ioredis");

const PORT  = parseInt(process.env.PORT || "3000", 10);
const HOST  = "0.0.0.0";
const ENV   = process.env.NODE_ENV || "development";
const REDIS = process.env.REDIS_URL || "redis://127.0.0.1:6379/0";

// ── Redis ─────────────────────────────────────────────────────
const redis = new Redis(REDIS, { lazyConnect: true, maxRetriesPerRequest: 3 });
redis.on("connect", () => console.log("[node-server] Redis connected"));
redis.on("error",   (e) => console.warn("[node-server] Redis warn:", e.message));
redis.connect().catch(() => {});

// ── Express ───────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*" }));
app.use(compression());
app.use(morgan(ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.set("trust proxy", 1);

app.use(rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));

// ── Routes ────────────────────────────────────────────────────
app.get("/", async (req, res) => {
  const wsClients = clients.size;
  let redisOk = false;
  try { await redis.ping(); redisOk = true; } catch {}
  res.json({
    service: "mosgarage node-server", version: "2.0.0",
    status: "online",
    connections: { websocket: wsClients },
    redis: redisOk ? "connected" : "unavailable",
    ports: { node: PORT, api: process.env.API_PORT || 4000, code: process.env.CODE_SERVER_PORT || 8080 },
    routes: {
      "GET  /":        "service info",
      "GET  /status":  "health + metrics",
      "WS   /ws":      "WebSocket hub",
      "GET  /workspace/": "static files",
    },
    time: new Date().toISOString(),
  });
});

app.get("/status", async (req, res) => {
  const mem  = process.memoryUsage();
  const os   = require("os");
  let redisPing = null;
  try { const t = Date.now(); await redis.ping(); redisPing = Date.now() - t; } catch {}
  res.json({
    status: "ok", uptime_s: Math.floor(process.uptime()), pid: process.pid,
    node: process.version, env: ENV,
    memory: { rss_mb: +(mem.rss/1048576).toFixed(2), heap_used_mb: +(mem.heapUsed/1048576).toFixed(2) },
    system: { cpus: os.cpus().length, load: os.loadavg().map(l=>+l.toFixed(2)), free_mem_mb: +(os.freemem()/1048576).toFixed(0) },
    redis: { ping_ms: redisPing },
    websocket: { clients: clients.size },
    time: new Date().toISOString(),
  });
});

app.use("/workspace", express.static("/app/workspace", { maxAge: "1h" }));

app.use((req, res) => res.status(404).json({ error: "Not found", path: req.originalUrl }));

// ── WebSocket ─────────────────────────────────────────────────
const wss     = new WebSocketServer({ server, path: "/ws" });
const clients = new Map();

wss.on("connection", (ws, req) => {
  const id = uuidv4();
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  clients.set(id, { ws, ip, connectedAt: Date.now() });
  console.log(`[ws] connect id=${id} ip=${ip} total=${clients.size}`);

  // Persist presence in Redis
  redis.hset("mosgarage:ws:clients", id, JSON.stringify({ ip, connectedAt: Date.now() })).catch(() => {});

  ws.send(JSON.stringify({ type: "welcome", id, clients: clients.size, time: new Date().toISOString() }));

  ws.on("message", (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch { msg = { type: "raw", data: raw.toString() }; }
    if (msg.type === "broadcast") {
      clients.forEach(({ ws: c }, cid) => {
        if (cid !== id && c.readyState === 1) c.send(JSON.stringify({ type: "broadcast", from: id, payload: msg.payload }));
      });
    }
    ws.send(JSON.stringify({ type: "ack", received: msg, time: new Date().toISOString() }));
  });

  ws.on("close", () => {
    clients.delete(id);
    redis.hdel("mosgarage:ws:clients", id).catch(() => {});
    console.log(`[ws] disconnect id=${id} total=${clients.size}`);
  });

  ws.on("error", () => { clients.delete(id); redis.hdel("mosgarage:ws:clients", id).catch(() => {}); });
});

// Heartbeat every 30s
setInterval(() => {
  clients.forEach(({ ws }, id) => {
    if (ws.readyState !== 1) { clients.delete(id); return; }
    ws.send(JSON.stringify({ type: "ping", clients: clients.size, time: new Date().toISOString() }));
  });
}, 30_000);

// ── Start ─────────────────────────────────────────────────────
server.listen(PORT, HOST, () => {
  console.log(`[node-server] http://${HOST}:${PORT}  ws://${HOST}:${PORT}/ws  env=${ENV}`);
});

const shutdown = (sig) => {
  console.log(`[node-server] ${sig} — shutdown`);
  clients.forEach(({ ws }) => ws.close());
  server.close(() => { redis.quit(); process.exit(0); });
  setTimeout(() => process.exit(1), 5000);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
