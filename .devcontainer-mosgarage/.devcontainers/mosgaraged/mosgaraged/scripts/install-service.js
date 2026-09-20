#!/usr/bin/env node
'use strict';

/**
 * mosgaraged service installer
 * Detects the current platform and installs mosgaraged as a background service.
 *
 *  Linux   → systemd unit  (/etc/systemd/system/mosgaraged.service)
 *  macOS   → launchd plist (~/Library/LaunchAgents/xyz.mosgarage.mosgaraged.plist)
 *  Windows → NSSM or sc.exe Windows Service
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DAEMON_DIR = path.resolve(__dirname, '..');
const NODE_BIN = process.execPath;
const DAEMON_SCRIPT = path.join(DAEMON_DIR, 'src', 'daemon.js');
const LOG_DIR = path.join(DAEMON_DIR, 'logs');
const USER = os.userInfo().username;

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', ...opts });
    return true;
  } catch {
    return false;
  }
}

// ── Linux (systemd) ───────────────────────────────────────────────────────

function installLinux() {
  const unit = `[Unit]
Description=MosGarage Workspace Daemon
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=${USER}
WorkingDirectory=${DAEMON_DIR}
ExecStart=${NODE_BIN} ${DAEMON_SCRIPT}
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mosgaraged
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;

  const unitPath = '/etc/systemd/system/mosgaraged.service';
  fs.writeFileSync('/tmp/mosgaraged.service', unit);
  run(`sudo cp /tmp/mosgaraged.service ${unitPath}`);
  run('sudo systemctl daemon-reload');
  run('sudo systemctl enable mosgaraged');
  run('sudo systemctl start mosgaraged');
  console.log(`\n✓  Installed systemd service: ${unitPath}`);
  console.log('   sudo systemctl status mosgaraged');
  console.log('   sudo journalctl -u mosgaraged -f');
}

// ── macOS (launchd) ───────────────────────────────────────────────────────

function installMacOS() {
  const plistDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
  const plistPath = path.join(plistDir, 'xyz.mosgarage.mosgaraged.plist');

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>xyz.mosgarage.mosgaraged</string>
    <key>ProgramArguments</key>
    <array>
        <string>${NODE_BIN}</string>
        <string>${DAEMON_SCRIPT}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${DAEMON_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/mosgaraged.out.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/mosgaraged.err.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
`;

  fs.mkdirSync(plistDir, { recursive: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(plistPath, plist);
  run(`launchctl load ${plistPath}`);
  console.log(`\n✓  Installed launchd agent: ${plistPath}`);
  console.log(`   launchctl list | grep mosgarage`);
  console.log(`   tail -f ${LOG_DIR}/mosgaraged.out.log`);
}

// ── Windows (NSSM or sc.exe) ──────────────────────────────────────────────

function installWindows() {
  // Try NSSM first (better service wrapper), fall back to simple sc.exe
  const nssmResult = spawnSync('where', ['nssm'], { encoding: 'utf8' });
  const hasNssm = nssmResult.status === 0;

  if (hasNssm) {
    run(`nssm install mosgaraged "${NODE_BIN}" "${DAEMON_SCRIPT}"`);
    run(`nssm set mosgaraged AppDirectory "${DAEMON_DIR}"`);
    run(`nssm set mosgaraged AppStdout "${LOG_DIR}\\mosgaraged.out.log"`);
    run(`nssm set mosgaraged AppStderr "${LOG_DIR}\\mosgaraged.err.log"`);
    run(`nssm set mosgaraged Start SERVICE_AUTO_START`);
    run('nssm start mosgaraged');
    console.log('\n✓  Installed Windows service via NSSM');
    console.log('   nssm status mosgaraged');
  } else {
    // sc.exe approach — basic but works without extra tools
    run(`sc create mosgaraged binPath= "${NODE_BIN} ${DAEMON_SCRIPT}" start= auto displayName= "MosGarage Daemon"`);
    run('sc start mosgaraged');
    console.log('\n✓  Installed Windows service via sc.exe');
    console.log('   sc query mosgaraged');
    console.log('\n   Tip: Install NSSM for better log management: https://nssm.cc');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

console.log('mosgaraged service installer');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Platform : ${process.platform}`);
console.log(`User     : ${USER}`);
console.log(`Daemon   : ${DAEMON_SCRIPT}`);
console.log('');

fs.mkdirSync(LOG_DIR, { recursive: true });

switch (process.platform) {
  case 'linux':  installLinux();   break;
  case 'darwin': installMacOS();   break;
  case 'win32':  installWindows(); break;
  default:
    console.error(`Unsupported platform: ${process.platform}`);
    console.error('Run manually: node src/daemon.js');
    process.exit(1);
}
