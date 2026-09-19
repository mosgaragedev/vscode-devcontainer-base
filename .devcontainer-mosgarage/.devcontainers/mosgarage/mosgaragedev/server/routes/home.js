"use strict";
const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({
    service:  "mosgarage node-server",
    version:  "1.0.0",
    ports: {
      node_server: process.env.NODE_SERVER_PORT || 3000,
      api:         process.env.API_PORT         || 4000,
      code_server: process.env.CODE_SERVER_PORT || 8080,
    },
    endpoints: [
      "GET  /           — this info",
      "GET  /status     — health + uptime",
      "WS   /ws         — WebSocket hub",
      "GET  /workspace/ — static files",
    ],
    time: new Date().toISOString(),
  });
});

module.exports = router;
