'use strict';

/**
 * mosgaraged — MosGarage Workspace Daemon
 * ========================================
 * Entrypoint that wires config, logger, Docker, apps manager,
 * health checker, and API server together.
 */

require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const config = require('./config').load();
const logger = require('./utils/logger');
const { WorkspaceAppsManager } = require('./workspaceapps/manager');
const { buildApi } = require('./api/server');

// ── Init logger early ─────────────────────────────────────────────────────

const log = logger.build(config);
const daemonLog = logger.child('daemon');

// ── PID file management ───────────────────────────────────────────────────

function writePid() {
  const pidPath = path.resolve(config.daemon.pidFile);
  fs.writeFileSync(pidPath, String(process.pid));
  daemonLog.info(`PID ${process.pid} written to ${pidPath}`);
}

function removePid() {
  const pidPath = path.resolve(config.daemon.pidFile);
  try { fs.unlinkSync(pidPath); } catch {}
}

// ── Docker client (optional) ──────────────────────────────────────────────

function tryLoadDocker() {
  if (!config.docker.enabled) return null;
  try {
    const Docker = require('dockerode');
    const opts = process.platform === 'win32'
      ? { socketPath: config.docker.windowsNamedPipe }
      : { socketPath: config.docker.socketPath };
    const docker = new Docker(opts);
    daemonLog.info(`Docker client initialised (socket: ${opts.socketPath})`);
    return docker;
  } catch (e) {
    daemonLog.warn(`Docker unavailable — process apps only (${e.message})`);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  daemonLog.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  daemonLog.info(' mosgaraged starting up');
  daemonLog.info(`  platform  : ${process.platform} (${process.arch})`);
  daemonLog.info(`  node      : ${process.version}`);
  daemonLog.info(`  api       : http://${config.daemon.host}:${config.daemon.port}`);
  daemonLog.info(`  log level : ${config.daemon.logLevel}`);
  daemonLog.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  writePid();

  const docker = tryLoadDocker();

  // ── Apps manager ─────────────────────────────────────────────────────────

  const appsManager = new WorkspaceAppsManager(config, docker);

  appsManager.on('app:started',   ({ id }) => daemonLog.info(`✓ ${id} started`));
  appsManager.on('app:exited',    ({ id, code }) => daemonLog.warn(`✗ ${id} exited (code ${code})`));
  appsManager.on('app:unhealthy', ({ id }) => daemonLog.error(`⚠ ${id} is unhealthy`));
  appsManager.on('app:recovered', ({ id }) => daemonLog.info(`↩ ${id} recovered`));

  await appsManager.loadDefinitions();

  if (config.workspaceapps.autoStartOnBoot) {
    await appsManager.startAll();
  }

  // ── Health check cron ─────────────────────────────────────────────────────

  if (config.healthcheck.enabled) {
    const interval = config.healthcheck.intervalSeconds;
    // Convert seconds to cron expression (runs every N seconds via setInterval)
    const hcInterval = setInterval(
      () => appsManager.checkAllHealth().catch(e => daemonLog.error(`Healthcheck error: ${e.message}`)),
      interval * 1000
    );
    daemonLog.info(`Health checks every ${interval}s`);
  }

  // ── HTTP + WS server ──────────────────────────────────────────────────────

  const daemonMeta = {
    name: config.daemon.name,
    version: require('../package.json').version,
    pid: process.pid,
    startedAt: new Date().toISOString(),
  };

  const apiApp = buildApi(appsManager, config, daemonMeta);
  const server = http.createServer(apiApp);

  server.listen(config.daemon.port, config.daemon.host, () => {
    daemonLog.info(`API listening on http://${config.daemon.host}:${config.daemon.port}`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    daemonLog.info(`Received ${signal} — shutting down gracefully...`);

    server.close();
    await appsManager.stopAll();
    removePid();

    daemonLog.info('mosgaraged stopped. Goodbye.');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGHUP',  async () => {
    daemonLog.info('SIGHUP received — reloading definitions...');
    await appsManager.loadDefinitions();
  });

  // Windows ctrl+c
  if (process.platform === 'win32') {
    process.on('message', msg => { if (msg === 'shutdown') shutdown('message'); });
  }

  process.on('uncaughtException', e => {
    daemonLog.error(`Uncaught exception: ${e.message}\n${e.stack}`);
  });

  process.on('unhandledRejection', (reason) => {
    daemonLog.error(`Unhandled rejection: ${reason}`);
  });
}

main().catch(e => {
  console.error('Fatal error during startup:', e);
  process.exit(1);
});
