'use strict';

/**
 * mosgaraged HTTP + WebSocket API
 * --------------------------------
 * REST  : /api/v1/apps, /api/v1/status, /api/v1/config
 * WS    : /ws/logs  — real-time log streaming per app
 */

const express = require('express');
const expressWs = require('express-ws');
const { child: logChild } = require('../utils/logger');

function buildApi(appsManager, config, daemonMeta) {
  const app = express();
  expressWs(app);
  const log = logChild('api');

  // ── Middleware ────────────────────────────────────────────────────────────

  app.use(express.json());

  if (config.api.cors) {
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') return res.sendStatus(204);
      next();
    });
  }

  if (config.api.auth.enabled) {
    app.use((req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token !== config.api.auth.token) return res.status(401).json({ error: 'Unauthorized' });
      next();
    });
  }

  app.use((req, _res, next) => {
    log.info(`${req.method} ${req.path}`);
    next();
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const ok = (res, data) => res.json({ ok: true, ...data });
  const err = (res, status, message) => res.status(status).json({ ok: false, error: message });

  // ── Daemon Status ─────────────────────────────────────────────────────────

  app.get('/api/v1/status', (_req, res) => {
    ok(res, {
      daemon: daemonMeta,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    });
  });

  // ── Apps ──────────────────────────────────────────────────────────────────

  app.get('/api/v1/apps', (_req, res) => {
    ok(res, { apps: appsManager.list() });
  });

  app.get('/api/v1/apps/definitions', (_req, res) => {
    ok(res, { definitions: appsManager.getDefinitions() });
  });

  app.get('/api/v1/apps/:id', (req, res) => {
    const app_ = appsManager.get(req.params.id);
    if (!app_) return err(res, 404, `App "${req.params.id}" not found`);
    ok(res, { app: app_ });
  });

  app.post('/api/v1/apps/:id/start', async (req, res) => {
    try {
      const runtime = await appsManager.start(req.params.id);
      ok(res, { app: appsManager.get(req.params.id) });
    } catch (e) {
      err(res, 400, e.message);
    }
  });

  app.post('/api/v1/apps/:id/stop', async (req, res) => {
    try {
      await appsManager.stop(req.params.id);
      ok(res, { app: appsManager.get(req.params.id) });
    } catch (e) {
      err(res, 400, e.message);
    }
  });

  app.post('/api/v1/apps/:id/restart', async (req, res) => {
    try {
      await appsManager.restart(req.params.id);
      ok(res, { app: appsManager.get(req.params.id) });
    } catch (e) {
      err(res, 400, e.message);
    }
  });

  app.get('/api/v1/apps/:id/health', async (req, res) => {
    const app_ = appsManager.get(req.params.id);
    if (!app_) return err(res, 404, `App "${req.params.id}" not found`);
    const healthy = await appsManager.checkHealth(req.params.id);
    ok(res, { healthy });
  });

  // ── Config ────────────────────────────────────────────────────────────────

  app.get('/api/v1/config', (_req, res) => {
    // Redact sensitive values
    const safe = JSON.parse(JSON.stringify(config));
    if (safe.api?.auth?.token) safe.api.auth.token = '***';
    ok(res, { config: safe });
  });

  // ── WebSocket — real-time log streaming ───────────────────────────────────

  app.ws('/ws/logs', (ws, req) => {
    const targetId = req.query.app; // optional: filter by app id
    log.info(`WS log client connected (app=${targetId || 'all'})`);

    const handler = ({ id, stream, data }) => {
      if (targetId && id !== targetId) return;
      if (ws.readyState !== 1 /* OPEN */) return;
      ws.send(JSON.stringify({ id, stream, data, ts: Date.now() }));
    };

    appsManager.on('app:log', handler);
    ws.on('close', () => appsManager.off('app:log', handler));
  });

  app.ws('/ws/events', (ws) => {
    log.info('WS event client connected');
    const handler = (event) => {
      if (ws.readyState !== 1) return;
      ws.send(JSON.stringify({ ...event, ts: Date.now() }));
    };

    const events = ['app:started', 'app:exited', 'app:state', 'app:unhealthy', 'app:recovered'];
    events.forEach(e => appsManager.on(e, (data) => handler({ event: e, ...data })));
    ws.on('close', () => events.forEach(e => appsManager.removeListener(e, handler)));
  });

  // ── 404 fallback ──────────────────────────────────────────────────────────

  app.use((_req, res) => err(res, 404, 'Not found'));

  // ── Error handler ─────────────────────────────────────────────────────────

  app.use((error, _req, res, _next) => {
    log.error(`Unhandled: ${error.message}`);
    err(res, 500, 'Internal server error');
  });

  return app;
}

module.exports = { buildApi };
