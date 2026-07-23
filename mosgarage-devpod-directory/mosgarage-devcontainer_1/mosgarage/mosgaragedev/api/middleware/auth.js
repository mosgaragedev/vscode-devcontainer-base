"use strict";

/**
 * API Key Auth Middleware
 * Set API_KEY env var to enable protection (leave unset = open in dev)
 * Pass key via:  Authorization: Bearer <key>
 *            or  X-API-Key: <key>
 */
const apiKeyAuth = (req, res, next) => {
  const configuredKey = process.env.API_KEY;

  // No key configured → open access (dev mode)
  if (!configuredKey) return next();

  const authHeader = req.headers["authorization"] || "";
  const xApiKey    = req.headers["x-api-key"]     || "";

  const provided =
    (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "") ||
    xApiKey;

  if (!provided) {
    return res.status(401).json({
      success: false,
      error:   "Authentication required",
      hint:    "Provide Authorization: Bearer <key> or X-Api-Key: <key>",
    });
  }

  if (provided !== configuredKey) {
    return res.status(403).json({ success: false, error: "Invalid API key" });
  }

  next();
};

module.exports = { apiKeyAuth };
