/**
 * mosgarage — Express API Server
 * Full REST API with versioning, auth middleware, and extensible routes
 * Port: 4000 (default) | env: API_PORT
 */

"use strict";

const express     = require("express");
const helmet      = require("helmet");
const cors        = require("cors");
const morgan      = require("morgan");
const compression = require("compression");
const rateLimit   = require("express-rate-limit");

// ── Config ────────────────────────────────────────────────────
const PORT  = parseInt(process.env.API_PORT || process.env.PORT || "4000", 10);
const HOST  = process.env.HOST   || "0.0.0.0";
const ENV   = process.env.NODE_ENV || "development";

const app   = express();

// ── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use(compression());
app.use(morgan(ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Rate limiter ──────────────────────────────────────────────
app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Rate limit exceeded. Try again in a minute." },
}));

// ── Request ID middleware ─────────────────────────────────────
const { v4: uuidv4 } = require("uuid");
app.use((req, _res, next) => {
  req.id = uuidv4();
  next();
});

// ── Custom middleware ─────────────────────────────────────────
const { apiKeyAuth } = require("./middleware/auth");
const { requestLogger } = require("./middleware/logger");
app.use(requestLogger);

// ── API Routes (v1) ───────────────────────────────────────────
const infoRoutes    = require("./routes/info");
const healthRoutes  = require("./routes/health");
const systemRoutes  = require("./routes/system");
const storageRoutes = require("./routes/storage");

app.use("/",              infoRoutes);
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/system", apiKeyAuth, systemRoutes);
app.use("/api/v1/store",  apiKeyAuth, storageRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error:   "Endpoint not found",
    path:    req.originalUrl,
    method:  req.method,
    hint:    "See GET / for available endpoints",
  });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[api] error [${req.id}]:`, err.message);
  res.status(err.status || 500).json({
    success: false,
    error:   ENV === "production" ? "Internal server error" : err.message,
    request_id: req.id,
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  mosgarage · api-server                  ║
╠══════════════════════════════════════════╣
║  REST  → http://${HOST}:${PORT}/api/v1   
║  ENV   → ${ENV}                          
╚══════════════════════════════════════════╝
  `);
});

// ── Graceful shutdown ─────────────────────────────────────────
process.on("SIGTERM", () => { console.log("[api] SIGTERM — shutting down"); process.exit(0); });
process.on("SIGINT",  () => { console.log("[api] SIGINT  — shutting down"); process.exit(0); });

module.exports = app;
