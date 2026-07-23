"use strict";
const router = require("express").Router();
const os     = require("os");

router.get("/", (req, res) => {
  const mem   = process.memoryUsage();
  const load  = os.loadavg();

  res.json({
    status:   "ok",
    service:  "node-server",
    uptime_s: Math.floor(process.uptime()),
    pid:      process.pid,
    node:     process.version,
    memory: {
      rss_mb:       (mem.rss       / 1024 / 1024).toFixed(2),
      heap_used_mb: (mem.heapUsed  / 1024 / 1024).toFixed(2),
      heap_total_mb:(mem.heapTotal / 1024 / 1024).toFixed(2),
    },
    system: {
      platform: os.platform(),
      arch:     os.arch(),
      cpus:     os.cpus().length,
      load_avg: load.map(l => l.toFixed(2)),
      free_mem_mb: (os.freemem() / 1024 / 1024).toFixed(0),
    },
    time: new Date().toISOString(),
  });
});

module.exports = router;
