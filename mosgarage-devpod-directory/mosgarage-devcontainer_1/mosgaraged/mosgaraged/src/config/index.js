'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.resolve(process.cwd(), 'mosgaraged.config.json');
const ENV_PREFIX = 'MGD_';

const DEFAULTS = {
  daemon: {
    port: 4747,
    host: '127.0.0.1',
    name: 'mosgaraged',
    pidFile: '.mosgaraged.pid',
    logLevel: 'info',
    logDir: './logs',
  },
  healthcheck: {
    enabled: true,
    intervalSeconds: 30,
    timeoutSeconds: 5,
    unhealthyThreshold: 3,
  },
  docker: {
    enabled: true,
    socketPath: '/var/run/docker.sock',
    windowsNamedPipe: '//./pipe/docker_engine',
    autoManage: true,
  },
  workspaceapps: {
    definitionsDir: './workspaceapps/definitions',
    autoStartOnBoot: true,
    restartPolicy: 'on-failure',
    maxRestarts: 5,
    restartDelayMs: 3000,
  },
  api: {
    cors: true,
    allowedOrigins: ['http://localhost:*', 'http://127.0.0.1:*'],
    auth: { enabled: false, token: '' },
  },
};

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source || {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function loadFromEnv() {
  const overrides = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(ENV_PREFIX)) continue;
    // MGD_DAEMON_PORT -> daemon.port
    const parts = key.slice(ENV_PREFIX.length).toLowerCase().split('_');
    if (parts.length < 2) continue;
    const section = parts[0];
    const field = parts.slice(1).join('_');
    if (!overrides[section]) overrides[section] = {};
    // Auto-cast booleans and numbers
    if (value === 'true') overrides[section][field] = true;
    else if (value === 'false') overrides[section][field] = false;
    else if (!isNaN(value) && value !== '') overrides[section][field] = Number(value);
    else overrides[section][field] = value;
  }
  return overrides;
}

function load() {
  let fileConfig = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.warn(`[mosgaraged] Warning: Could not parse ${CONFIG_FILE}: ${e.message}`);
    }
  }

  const envConfig = loadFromEnv();
  const config = deepMerge(deepMerge(DEFAULTS, fileConfig), envConfig);

  // Resolve relative paths
  config.workspaceapps.definitionsDir = path.resolve(
    process.cwd(),
    config.workspaceapps.definitionsDir
  );
  config.daemon.logDir = path.resolve(process.cwd(), config.daemon.logDir);

  // Platform-aware Docker socket
  if (process.platform === 'win32') {
    config.docker.socketPath = config.docker.windowsNamedPipe;
  }

  return config;
}

module.exports = { load };
