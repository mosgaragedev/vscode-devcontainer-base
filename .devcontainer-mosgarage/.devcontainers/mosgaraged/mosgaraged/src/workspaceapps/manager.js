'use strict';

/**
 * WorkspaceApps Manager
 * ---------------------
 * Loads app definitions from JSON/YAML files, manages their lifecycle
 * (start / stop / restart / healthcheck) for both process-based and
 * Docker-based apps across Linux, macOS, and Windows.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const { child: logChild } = require('../utils/logger');

// App states
const STATE = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  UNHEALTHY: 'unhealthy',
  RESTARTING: 'restarting',
  ERROR: 'error',
};

class WorkspaceAppsManager extends EventEmitter {
  constructor(config, docker) {
    super();
    this.config = config;
    this.docker = docker;
    this.log = logChild('apps');
    this.apps = new Map(); // id -> runtime record
    this.definitions = new Map(); // id -> definition
    this._restartTimers = new Map();
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  async loadDefinitions() {
    const dir = this.config.workspaceapps.definitionsDir;
    if (!fs.existsSync(dir)) {
      this.log.warn(`Definitions directory not found: ${dir}`);
      return;
    }

    const files = fs.readdirSync(dir).filter(f => /\.(json|yaml|yml)$/.test(f));
    this.log.info(`Loading ${files.length} app definition(s) from ${dir}`);

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(dir, file), 'utf8');
        const def = file.endsWith('.json') ? JSON.parse(raw) : require('yaml').parse(raw);
        this._validateDefinition(def);
        this.definitions.set(def.id, def);
        this.log.info(`Loaded app: ${def.id} (${def.type})`);
      } catch (e) {
        this.log.error(`Failed to load ${file}: ${e.message}`);
      }
    }
  }

  _validateDefinition(def) {
    const required = ['id', 'name', 'type'];
    for (const field of required) {
      if (!def[field]) throw new Error(`Missing required field: "${field}"`);
    }
    if (!['process', 'docker'].includes(def.type)) {
      throw new Error(`Unknown type "${def.type}" — must be "process" or "docker"`);
    }
    if (def.type === 'process' && !def.command) {
      throw new Error('"process" apps require a "command" field');
    }
    if (def.type === 'docker' && !def.image && !def.container) {
      throw new Error('"docker" apps require an "image" or "container" field');
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async startAll() {
    const autoStart = [...this.definitions.values()].filter(d => d.autoStart !== false);
    this.log.info(`Auto-starting ${autoStart.length} app(s)`);
    for (const def of autoStart) {
      await this.start(def.id).catch(e => this.log.error(`Failed to start ${def.id}: ${e.message}`));
    }
  }

  async stopAll() {
    this.log.info('Stopping all apps...');
    const ids = [...this.apps.keys()];
    await Promise.all(ids.map(id => this.stop(id).catch(() => {})));
  }

  async start(id) {
    const def = this.definitions.get(id);
    if (!def) throw new Error(`Unknown app: ${id}`);

    const existing = this.apps.get(id);
    if (existing && existing.state === STATE.RUNNING) {
      this.log.warn(`${id} is already running`);
      return existing;
    }

    this.log.info(`Starting ${id} (${def.type})`);
    this._setState(id, STATE.STARTING, def);

    if (def.type === 'process') return this._startProcess(def);
    if (def.type === 'docker')  return this._startDocker(def);
  }

  async stop(id) {
    const runtime = this.apps.get(id);
    if (!runtime) return;

    this._clearRestartTimer(id);
    this.log.info(`Stopping ${id}`);

    if (runtime.definition.type === 'process') {
      await this._stopProcess(runtime);
    } else {
      await this._stopDocker(runtime);
    }

    this._setState(id, STATE.STOPPED);
  }

  async restart(id) {
    await this.stop(id);
    await new Promise(r => setTimeout(r, 500));
    return this.start(id);
  }

  // ── Process Apps ──────────────────────────────────────────────────────────

  _startProcess(def) {
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32';
      const env = { ...process.env, ...def.env };
      const cwd = def.cwd ? path.resolve(def.cwd) : process.cwd();

      // Cross-platform command resolution
      const [cmd, ...args] = isWindows
        ? ['cmd', '/c', def.command, ...(def.args || [])]
        : ['/bin/sh', '-c', [def.command, ...(def.args || [])].join(' ')];

      const proc = spawn(cmd, args, {
        env,
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        shell: false,
      });

      const runtime = this._setState(def.id, STATE.STARTING, def, { pid: proc.pid, proc });

      proc.stdout.on('data', d => this.emit('app:log', { id: def.id, stream: 'stdout', data: d.toString() }));
      proc.stderr.on('data', d => this.emit('app:log', { id: def.id, stream: 'stderr', data: d.toString() }));

      proc.once('spawn', () => {
        this._setState(def.id, STATE.RUNNING);
        this.emit('app:started', { id: def.id });
        resolve(this.apps.get(def.id));
      });

      proc.once('error', err => {
        this._setState(def.id, STATE.ERROR);
        reject(err);
      });

      proc.once('exit', (code, signal) => {
        this.log.warn(`${def.id} exited (code=${code}, signal=${signal})`);
        this._setState(def.id, STATE.STOPPED);
        this.emit('app:exited', { id: def.id, code, signal });
        this._maybeRestart(def, code);
      });
    });
  }

  async _stopProcess(runtime) {
    const { proc } = runtime;
    if (!proc || proc.exitCode !== null) return;
    return new Promise(resolve => {
      proc.once('exit', resolve);
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
      } else {
        proc.kill('SIGTERM');
        setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} }, 5000);
      }
    });
  }

  // ── Docker Apps ───────────────────────────────────────────────────────────

  async _startDocker(def) {
    if (!this.docker) throw new Error('Docker is not available');

    if (def.container) {
      // Start an existing named container
      try {
        const c = this.docker.getContainer(def.container);
        await c.start();
        this._setState(def.id, STATE.RUNNING, def, { containerId: def.container });
        this.emit('app:started', { id: def.id });
        return this.apps.get(def.id);
      } catch (e) {
        throw new Error(`Could not start container "${def.container}": ${e.message}`);
      }
    }

    // Create and start from image
    const createOpts = {
      Image: def.image,
      name: def.containerName || `mgd-${def.id}`,
      Env: Object.entries(def.env || {}).map(([k, v]) => `${k}=${v}`),
      ExposedPorts: {},
      HostConfig: {
        PortBindings: {},
        RestartPolicy: { Name: 'unless-stopped' },
        Binds: def.volumes || [],
      },
      Labels: { 'mosgaraged.managed': 'true', 'mosgaraged.app': def.id },
    };

    for (const port of def.ports || []) {
      const [host, container] = port.split(':');
      createOpts.ExposedPorts[`${container}/tcp`] = {};
      createOpts.HostConfig.PortBindings[`${container}/tcp`] = [{ HostPort: host }];
    }

    const container = await this.docker.createContainer(createOpts);
    await container.start();
    this._setState(def.id, STATE.RUNNING, def, { containerId: container.id });
    this.emit('app:started', { id: def.id });
    return this.apps.get(def.id);
  }

  async _stopDocker(runtime) {
    if (!this.docker) return;
    const { containerId } = runtime;
    if (!containerId) return;
    try {
      const c = this.docker.getContainer(containerId);
      await c.stop({ t: 10 });
    } catch (e) {
      if (!e.message.includes('not running')) this.log.warn(`Docker stop: ${e.message}`);
    }
  }

  // ── Health Checks ─────────────────────────────────────────────────────────

  async checkHealth(id) {
    const runtime = this.apps.get(id);
    if (!runtime || runtime.state !== STATE.RUNNING) return null;

    const def = runtime.definition;
    let healthy = true;

    if (def.healthcheck) {
      const hc = def.healthcheck;

      if (hc.type === 'http') {
        try {
          const fetch = require('node-fetch');
          const url = hc.url || `http://localhost:${hc.port}${hc.path || '/'}`;
          const res = await Promise.race([
            fetch(url),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), (hc.timeoutMs || 5000))),
          ]);
          healthy = hc.expectedStatus ? res.status === hc.expectedStatus : res.ok;
        } catch {
          healthy = false;
        }
      } else if (hc.type === 'process') {
        healthy = runtime.proc && runtime.proc.exitCode === null;
      } else if (hc.type === 'docker') {
        try {
          const c = this.docker.getContainer(runtime.containerId);
          const info = await c.inspect();
          healthy = info.State.Running;
        } catch {
          healthy = false;
        }
      }
    } else {
      // Default: process still alive or container running
      if (def.type === 'process') healthy = runtime.proc && runtime.proc.exitCode === null;
    }

    // Track consecutive failures
    if (!healthy) {
      runtime.failCount = (runtime.failCount || 0) + 1;
      if (runtime.failCount >= this.config.healthcheck.unhealthyThreshold) {
        this._setState(id, STATE.UNHEALTHY);
        this.emit('app:unhealthy', { id });
      }
    } else {
      runtime.failCount = 0;
      if (runtime.state === STATE.UNHEALTHY) {
        this._setState(id, STATE.RUNNING);
        this.emit('app:recovered', { id });
      }
    }

    return healthy;
  }

  async checkAllHealth() {
    const ids = [...this.apps.keys()];
    await Promise.all(ids.map(id => this.checkHealth(id).catch(() => {})));
  }

  // ── Restart Policy ────────────────────────────────────────────────────────

  _maybeRestart(def, exitCode) {
    const policy = def.restartPolicy || this.config.workspaceapps.restartPolicy;
    const runtime = this.apps.get(def.id);
    if (!runtime) return;

    const restarts = runtime.restartCount || 0;
    const maxRestarts = def.maxRestarts ?? this.config.workspaceapps.maxRestarts;

    if (policy === 'always' || (policy === 'on-failure' && exitCode !== 0)) {
      if (restarts >= maxRestarts) {
        this.log.error(`${def.id} hit max restarts (${maxRestarts}), giving up`);
        this._setState(def.id, STATE.ERROR);
        return;
      }
      const delay = this.config.workspaceapps.restartDelayMs;
      this.log.info(`Restarting ${def.id} in ${delay}ms (attempt ${restarts + 1}/${maxRestarts})`);
      runtime.restartCount = restarts + 1;
      const timer = setTimeout(() => {
        this._restartTimers.delete(def.id);
        this.start(def.id).catch(e => this.log.error(`Restart failed for ${def.id}: ${e.message}`));
      }, delay);
      this._restartTimers.set(def.id, timer);
    }
  }

  _clearRestartTimer(id) {
    const t = this._restartTimers.get(id);
    if (t) { clearTimeout(t); this._restartTimers.delete(id); }
  }

  // ── State Management ──────────────────────────────────────────────────────

  _setState(id, state, definition, extra = {}) {
    const existing = this.apps.get(id) || {};
    const runtime = {
      ...existing,
      ...extra,
      id,
      state,
      definition: definition || existing.definition,
      updatedAt: new Date().toISOString(),
      startedAt: state === STATE.RUNNING ? new Date().toISOString() : (existing.startedAt || null),
    };
    this.apps.set(id, runtime);
    this.emit('app:state', { id, state });
    return runtime;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  list() {
    return [...this.apps.values()].map(r => this._publicRecord(r));
  }

  get(id) {
    const r = this.apps.get(id);
    return r ? this._publicRecord(r) : null;
  }

  _publicRecord(r) {
    return {
      id: r.id,
      name: r.definition?.name,
      type: r.definition?.type,
      state: r.state,
      pid: r.pid || null,
      containerId: r.containerId ? r.containerId.slice(0, 12) : null,
      restartCount: r.restartCount || 0,
      startedAt: r.startedAt,
      updatedAt: r.updatedAt,
    };
  }

  getDefinitions() {
    return [...this.definitions.values()];
  }
}

module.exports = { WorkspaceAppsManager, STATE };
