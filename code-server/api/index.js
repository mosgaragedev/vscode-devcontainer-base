"use strict";
const express     = require("express");
const helmet      = require("helmet");
const cors        = require("cors");
const morgan      = require("morgan");
const compression = require("compression");
const rateLimit   = require("express-rate-limit");
const Redis       = require("ioredis");
const { v4: uuidv4 } = require("uuid");

const PORT  = parseInt(process.env.PORT || "4000", 10);
const HOST  = "0.0.0.0";
const ENV   = process.env.NODE_ENV || "development";
const REDIS = process.env.REDIS_URL || "redis://127.0.0.1:6379/1";

// ── Redis ─────────────────────────────────────────────────────
const redis = new Redis(REDIS, { lazyConnect: true, maxRetriesPerRequest: 3 });
redis.on("connect", () => console.log("[api] Redis connected"));
redis.on("error",   (e) => console.warn("[api] Redis warn:", e.message));
redis.connect().catch(() => {});

const app = express();
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(compression());
app.use(morgan(ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.set("trust proxy", 1);

// Request ID
app.use((req, _res, next) => { req.id = uuidv4(); next(); });

// Rate limiter
app.use("/api/", rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: "Rate limit exceeded" }
}));

// ── Auth middleware ───────────────────────────────────────────
const auth = (req, res, next) => {
  const key = process.env.API_KEY;
  if (!key) return next();
  const provided = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "") || req.headers["x-api-key"] || "";
  if (!provided) return res.status(401).json({ success: false, error: "Authentication required" });
  if (provided !== key) return res.status(403).json({ success: false, error: "Invalid API key" });
  next();
};

// ── Logger ────────────────────────────────────────────────────
app.use((req, res, next) => {
  const t = Date.now();
  res.on("finish", () => console.log(`[api] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now()-t}ms) [${req.id}]`));
  next();
});

// ── Info ──────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({
  service: "mosgarage api-server", version: "2.0.0",
  base_url: "/api/v1",
  auth: process.env.API_KEY ? "Bearer token / X-API-Key required" : "Open (set API_KEY to enable)",
  endpoints: {
    "GET  /api/v1/health":        "Health (public)",
    "GET  /api/v1/system":        "System info [auth]",
    "GET  /api/v1/system/env":    "Safe env dump [auth]",
    "GET  /api/v1/git":           "Git sync status [auth]",
    "GET  /api/v1/store":         "List store keys [auth]",
    "GET  /api/v1/store/:key":    "Get value [auth]",
    "POST /api/v1/store/:key":    "Set value [auth]",
    "DELETE /api/v1/store/:key":  "Delete key [auth]",
    "POST /api/v1/git/sync":      "Trigger immediate git push [auth]",
  },
  time: new Date().toISOString(),
}));

// ── Health ────────────────────────────────────────────────────
app.get("/api/v1/health", async (req, res) => {
  let redisOk = false;
  let redisPing = null;
  try { const t = Date.now(); await redis.ping(); redisPing = Date.now() - t; redisOk = true; } catch {}
  const status = redisOk ? "healthy" : "degraded";
  res.status(redisOk ? 200 : 207).json({
    success: true, status, uptime_s: Math.floor(process.uptime()),
    redis: { ok: redisOk, ping_ms: redisPing },
    time: new Date().toISOString(),
  });
});

// ── System ────────────────────────────────────────────────────
const os = require("os");
app.get("/api/v1/system", auth, (req, res) => {
  const mem = process.memoryUsage();
  res.json({ success: true,
    system: {
      hostname: os.hostname(), platform: os.platform(), arch: os.arch(),
      cpus: os.cpus().length, load: os.loadavg().map(l=>+l.toFixed(3)),
      total_mem_mb: +(os.totalmem()/1048576).toFixed(0),
      free_mem_mb:  +(os.freemem()/1048576).toFixed(0),
      uptime_s: Math.floor(os.uptime()),
    },
    process: {
      pid: process.pid, node: process.version,
      uptime_s: Math.floor(process.uptime()),
      memory: { rss_mb: +(mem.rss/1048576).toFixed(2), heap_used_mb: +(mem.heapUsed/1048576).toFixed(2) },
    },
    time: new Date().toISOString(),
  });
});

app.get("/api/v1/system/env", auth, (req, res) => {
  const safe = {};
  ["NODE_ENV","CODE_SERVER_PORT","NODE_SERVER_PORT","API_PORT","GITHUB_ORG","GITHUB_REPO","GIT_BRANCH","GIT_SYNC_INTERVAL"]
    .forEach(k => { if (process.env[k]) safe[k] = process.env[k]; });
  res.json({ success: true, env: safe });
});

// ── Git control ───────────────────────────────────────────────
const { execSync } = require("child_process");
app.get("/api/v1/git", auth, async (req, res) => {
  const lastPush  = await redis.get("mosgarage:git:last-push").catch(() => null);
  const lastSetup = await redis.get("mosgarage:git:last-setup").catch(() => null);
  let head = "unknown";
  try { head = execSync("git -C /app/workspace log --oneline -1 2>/dev/null", { timeout: 3000 }).toString().trim(); } catch {}
  res.json({ success: true,
    repo: `github.com/${process.env.GITHUB_ORG || "mosgarage"}/${process.env.GITHUB_REPO || "mosgaragedev"}`,
    branch: process.env.GIT_BRANCH || "main",
    sync_interval_s: parseInt(process.env.GIT_SYNC_INTERVAL || "900"),
    last_push: lastPush, last_setup: lastSetup, head,
    time: new Date().toISOString(),
  });
});

app.post("/api/v1/git/sync", auth, (req, res) => {
  try {
    require("fs").writeFileSync("/tmp/mosgarage-git-push-now", "");
    res.json({ success: true, message: "Sync triggered — daemon will push within 5 seconds" });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Redis-backed KV store ─────────────────────────────────────
const STORE_PREFIX = "mosgarage:store:";
const TTL_DEFAULT  = 0; // no expiry — set TTL via ?ttl=seconds

app.get("/api/v1/store", auth, async (req, res) => {
  try {
    const keys = await redis.keys(`${STORE_PREFIX}*`);
    const pretty = keys.map(k => k.replace(STORE_PREFIX, ""));
    res.json({ success: true, count: pretty.length, keys: pretty });
  } catch { res.status(500).json({ success: false, error: "Redis unavailable" }); }
});

app.get("/api/v1/store/:key", auth, async (req, res) => {
  try {
    const val = await redis.get(`${STORE_PREFIX}${req.params.key}`);
    if (val === null) return res.status(404).json({ success: false, error: `Key "${req.params.key}" not found` });
    let parsed; try { parsed = JSON.parse(val); } catch { parsed = val; }
    res.json({ success: true, key: req.params.key, value: parsed });
  } catch { res.status(500).json({ success: false, error: "Redis unavailable" }); }
});

app.post("/api/v1/store/:key", auth, async (req, res) => {
  const { value, ttl } = req.body;
  if (value === undefined) return res.status(400).json({ success: false, error: "Body must include { value }" });
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  if (serialized.length > 65536) return res.status(413).json({ success: false, error: "Value exceeds 64KB limit" });
  try {
    const rkey = `${STORE_PREFIX}${req.params.key}`;
    if (ttl) await redis.setex(rkey, parseInt(ttl), serialized);
    else      await redis.set(rkey, serialized);
    res.status(201).json({ success: true, key: req.params.key, ttl: ttl || null });
  } catch { res.status(500).json({ success: false, error: "Redis unavailable" }); }
});

app.delete("/api/v1/store/:key", auth, async (req, res) => {
  try {
    const deleted = await redis.del(`${STORE_PREFIX}${req.params.key}`);
    if (!deleted) return res.status(404).json({ success: false, error: `Key "${req.params.key}" not found` });
    res.json({ success: true, key: req.params.key, deleted: true });
  } catch { res.status(500).json({ success: false, error: "Redis unavailable" }); }
});

// ── 404 / Error ───────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, error: "Not found", path: req.originalUrl }));
app.use((err, req, res, _next) => {
  console.error(`[api] error [${req.id}]:`, err.message);
  res.status(500).json({ success: false, error: ENV === "production" ? "Internal server error" : err.message });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, HOST, () => console.log(`[api] http://${HOST}:${PORT}/api/v1  env=${ENV}`));
process.on("SIGTERM", () => { redis.quit(); process.exit(0); });
process.on("SIGINT",  () => { redis.quit(); process.exit(0); });
module.exports = app;
