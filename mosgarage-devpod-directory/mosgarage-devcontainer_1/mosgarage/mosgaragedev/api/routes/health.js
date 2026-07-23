"use strict";
const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({
    success:  true,
    status:   "healthy",
    uptime_s: Math.floor(process.uptime()),
    time:     new Date().toISOString(),
  });
});

module.exports = router;
