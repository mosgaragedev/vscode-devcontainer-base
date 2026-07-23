"use strict";

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms  = Date.now() - start;
    const lvl = res.statusCode >= 500 ? "ERROR"
              : res.statusCode >= 400 ? "WARN"
              : "INFO";
    console.log(`[api][${lvl}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms) [${req.id}]`);
  });
  next();
};

module.exports = { requestLogger };
