module.exports = {
  apps: [
    {
      name: "node-server",
      script: "/app/server/index.js",
      cwd: "/app/server",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", PORT: process.env.NODE_SERVER_PORT || 3000, REDIS_URL: "redis://127.0.0.1:6379/0" },
      error_file: "/var/log/mosgarage/node-server.err",
      out_file:   "/var/log/mosgarage/node-server.log",
      max_restarts: 10, restart_delay: 3000,
    },
    {
      name: "api-server",
      script: "/app/api/index.js",
      cwd: "/app/api",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", PORT: process.env.API_PORT || 4000, REDIS_URL: "redis://127.0.0.1:6379/1" },
      error_file: "/var/log/mosgarage/api-server.err",
      out_file:   "/var/log/mosgarage/api-server.log",
      max_restarts: 10, restart_delay: 3000,
    },
  ],
};
