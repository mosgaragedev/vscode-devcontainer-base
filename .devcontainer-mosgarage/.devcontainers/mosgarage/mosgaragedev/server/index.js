/**
 * mosgarage — Node Server
 * HTTP server + WebSocket hub + static file serving
 * Port: 3000 (default) | env: NODE_SERVER_PORT
 */

"use strict";

const http        = require("http");
const path        = require("path");
const express     = require("express");
const helmet      = require("helmet");
const cors        = require("cors");
const morgan      = require("morgan");
const compression = require("compression");
const rateLimit   = require("express-rate-limit");
const { WebSocketServer } = require("ws");
const { v4: uuidv4 } = require("uuid");

// ── Config ────────────────────────────────────────────────────
const PORT    = parseInt(process.env.NODE_SERVER_PORT || process.env.PORT || "3000", 10);
const HOST    = process.env.HOST || "0.0.0.0";
const ENV     = process.env.NODE_ENV || "development";

const app     = express();
const server  = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
app.use(compression());
app.use(morgan(ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Rate limiter ──────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — slow down." },
}));

// ── Static files (workspace public dir) ──────────────────────
app.use("/workspace", express.static("/app/workspace", { maxAge: "1h" }));

// ── Routes ────────────────────────────────────────────────────
const homeRoutes   = require("./routes/home");
const statusRoutes = require("./routes/status");

app.use("/",       homeRoutes);
app.use("/status", statusRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[node-server] error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ── WebSocket server ──────────────────────────────────────────
const wss     = new WebSocketServer({ server, path: "/ws" });
const clients = new Map(); // id → ws

wss.on("connection", (ws, req) => {
  const id = uuidv4();
  clients.set(id, ws);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  console.log(`[ws] client connected  id=${id} ip=${ip} total=${clients.size}`);

  ws.send(JSON.stringify({
    type: "welcome",
    id,
    message: "Connected to mosgarage node-server",
    time: new Date().toISOString(),
    clients: clients.size,
  }));

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { msg = { type: "raw", data: raw.toString() }; }

    console.log(`[ws] message from ${id}:`, msg);

    // Broadcast to all except sender
    if (msg.type === "broadcast") {
      clients.forEach((client, cid) => {
        if (cid !== id && client.readyState === 1) {
          client.send(JSON.stringify({ type: "broadcast", from: id, payload: msg.payload }));
        }
      });
    }

    // Echo back
    ws.send(JSON.stringify({ type: "ack", received: msg, time: new Date().toISOString() }));
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log(`[ws] client disconnected id=${id} total=${clients.size}`);
  });

  ws.on("error", (err) => {
    console.error(`[ws] error id=${id}:`, err.message);
    clients.delete(id);
  });
});

// ── Heartbeat (ping all WS clients every 30s) ─────────────────
setInterval(() => {
  clients.forEach((ws, id) => {
    if (ws.readyState !== 1) { clients.delete(id); return; }
    ws.send(JSON.stringify({ type: "ping", time: new Date().toISOString(), clients: clients.size }));
  });
}, 30_000);

// ── Start ─────────────────────────────────────────────────────
server.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  mosgarage · node-server                 ║
╠══════════════════════════════════════════╣
║  HTTP  → http://${HOST}:${PORT}          
║  WS    → ws://${HOST}:${PORT}/ws         
║  ENV   → ${ENV}                          
╚══════════════════════════════════════════╝
  `);
});

// ── Graceful shutdown ─────────────────────────────────────────
const shutdown = (sig) => {
  console.log(`[node-server] ${sig} received — shutting down`);
  clients.forEach((ws) => ws.close());
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
