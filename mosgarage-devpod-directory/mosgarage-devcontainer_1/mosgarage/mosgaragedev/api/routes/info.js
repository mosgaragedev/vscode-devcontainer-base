"use strict";
const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({
    service: "mosgarage api-server",
    version: "1.0.0",
    base_url: "/api/v1",
    endpoints: {
      "GET  /api/v1/health":        "Health check (public)",
      "GET  /api/v1/system":        "System info       [auth]",
      "GET  /api/v1/system/env":    "Safe env dump     [auth]",
      "GET  /api/v1/store":         "List stored keys  [auth]",
      "GET  /api/v1/store/:key":    "Get stored value  [auth]",
      "POST /api/v1/store/:key":    "Set stored value  [auth]",
      "DELETE /api/v1/store/:key":  "Delete stored key [auth]",
    },
    auth: process.env.API_KEY ? "Bearer token / X-API-Key required" : "Open (set API_KEY env to enable)",
    time: new Date().toISOString(),
  });
});

module.exports = router;
