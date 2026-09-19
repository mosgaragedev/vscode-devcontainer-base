"use strict";
const router = require("express").Router();
const os     = require("os");

router.get("/", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    success: true,
    system: {
      hostname:    os.hostname(),
      platform:    os.platform(),
      arch:        os.arch(),
      cpus:        os.cpus().length,
      cpu_model:   os.cpus()[0]?.model || "unknown",
      load_avg:    os.loadavg().map(l => +l.toFixed(3)),
      total_mem_mb: (os.totalmem() / 1024 / 1024).toFixed(0),
      free_mem_mb:  (os.freemem()  / 1024 / 1024).toFixed(0),
      uptime_s:    Math.floor(os.uptime()),
    },
    process: {
      pid:          process.pid,
      node_version: process.version,
      uptime_s:     Math.floor(process.uptime()),
      memory: {
        rss_mb:        (mem.rss        / 1024 / 1024).toFixed(2),
        heap_used_mb:  (mem.heapUsed   / 1024 / 1024).toFixed(2),
        heap_total_mb: (mem.heapTotal  / 1024 / 1024).toFixed(2),
      },
    },
    time: new Date().toISOString(),
  });
});

// Safe env dump — only mosgarage-specific vars
router.get("/env", (req, res) => {
  const safe = {};
  const allowed = ["NODE_ENV", "CODE_SERVER_PORT", "NODE_SERVER_PORT", "API_PORT", "HOME_DIR", "APP_DIR"];
  allowed.forEach(k => { if (process.env[k]) safe[k] = process.env[k]; });
  res.json({ success: true, env: safe });
});

module.exports = router;
