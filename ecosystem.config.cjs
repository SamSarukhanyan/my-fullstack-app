// ecosystem.config.cjs
// PORT and NODE_ENV come from the environment (e.g. set by deploy workflow before pm2 reload).
// Logs go to PM2 default: ~/.pm2/logs/ (no custom log dir on server).

module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './server',
      script: 'src/index.js',
      instances: "max",
      exec_mode: 'cluster',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.PORT || 4004,
        LOG_PRETTY: process.env.LOG_PRETTY || 'true',
      },
      env_production: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || 4004,
        LOG_PRETTY: process.env.LOG_PRETTY || 'false',
      },
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
