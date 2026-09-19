"use strict";
const router  = require("express").Router();

// Simple in-memory store (replace with Redis/SQLite for persistence)
const store   = new Map();
const MAX_KEYS = 500;
const MAX_VAL  = 64 * 1024; // 64 KB per value

router.get("/", (req, res) => {
  const keys = [...store.keys()];
  res.json({ success: true, count: keys.length, keys });
});

router.get("/:key", (req, res) => {
  const { key } = req.params;
  if (!store.has(key)) return res.status(404).json({ success: false, error: `Key "${key}" not found` });
  res.json({ success: true, key, value: store.get(key) });
});

router.post("/:key", (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined) return res.status(400).json({ success: false, error: "Body must include { value }" });

  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  if (serialized.length > MAX_VAL) return res.status(413).json({ success: false, error: `Value exceeds ${MAX_VAL} byte limit` });
  if (store.size >= MAX_KEYS && !store.has(key)) return res.status(507).json({ success: false, error: `Store limit of ${MAX_KEYS} keys reached` });

  store.set(key, value);
  res.status(201).json({ success: true, key, stored: true });
});

router.delete("/:key", (req, res) => {
  const { key } = req.params;
  if (!store.has(key)) return res.status(404).json({ success: false, error: `Key "${key}" not found` });
  store.delete(key);
  res.json({ success: true, key, deleted: true });
});

module.exports = router;
