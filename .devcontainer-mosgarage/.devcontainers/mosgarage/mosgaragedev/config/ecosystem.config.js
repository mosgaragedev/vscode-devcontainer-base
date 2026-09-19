// PM2 Ecosystem — mosgarage home base
// Usage: pm2 start /app/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "node-server",
      script: "/app/server/index.js",
      cwd: "/app/server",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        PORT: process.env.NODE_SERVER_PORT || 3000,
      },
      error_file: "/var/log/mosgarage/node-server.err",
      out_file: "/var/log/mosgarage/node-server.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: "api-server",
      script: "/app/api/index.js",
      cwd: "/app/api",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        PORT: process.env.API_PORT || 4000,
      },
      error_file: "/var/log/mosgarage/api-server.err",
      out_file: "/var/log/mosgarage/api-server.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
