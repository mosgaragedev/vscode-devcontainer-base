#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function run(cmd) {
  try { execSync(cmd, { stdio: 'inherit' }); return true; } catch { return false; }
}

console.log('mosgaraged service uninstaller\n');

switch (process.platform) {
  case 'linux':
    run('sudo systemctl stop mosgaraged');
    run('sudo systemctl disable mosgaraged');
    run('sudo rm -f /etc/systemd/system/mosgaraged.service');
    run('sudo systemctl daemon-reload');
    console.log('✓  Removed systemd service');
    break;

  case 'darwin': {
    const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', 'xyz.mosgarage.mosgaraged.plist');
    run(`launchctl unload ${plistPath}`);
    fs.existsSync(plistPath) && fs.unlinkSync(plistPath);
    console.log('✓  Removed launchd agent');
    break;
  }

  case 'win32':
    run('sc stop mosgaraged');
    run('sc delete mosgaraged');
    // Also try nssm
    run('nssm stop mosgaraged');
    run('nssm remove mosgaraged confirm');
    console.log('✓  Removed Windows service');
    break;

  default:
    console.error(`Unsupported platform: ${process.platform}`);
    process.exit(1);
}
