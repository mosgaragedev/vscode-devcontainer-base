'use strict';

const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

let _logger = null;

function build(config) {
  const { logDir, logLevel, name } = config.daemon;

  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const consoleFormat = format.combine(
    format.colorize(),
    format.timestamp({ format: 'HH:mm:ss' }),
    format.printf(({ level, message, timestamp, component }) => {
      const tag = component ? ` [${component}]` : '';
      return `${timestamp} ${level}${tag}: ${message}`;
    })
  );

  const fileFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  );

  _logger = createLogger({
    level: logLevel,
    defaultMeta: { daemon: name },
    transports: [
      new transports.Console({ format: consoleFormat }),
      new transports.DailyRotateFile({
        filename: path.join(logDir, '%DATE%-mosgaraged.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        maxSize: '20m',
        format: fileFormat,
      }),
    ],
  });

  return _logger;
}

function get() {
  if (!_logger) throw new Error('Logger not initialised — call build(config) first');
  return _logger;
}

function child(component) {
  return get().child({ component });
}

module.exports = { build, get, child };
