// ecosystem.config.cjs
// PORT and NODE_ENV come from the environment (e.g. set by deploy workflow before pm2 reload).
// The app itself reads server/.env via db-config.js and index.js.

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
        LOG_PATH: process.env.LOG_PATH || '/home/sam/logs/api.json',
        LOG_PRETTY: process.env.LOG_PRETTY || 'true',
      },
      env_production: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || 4004,
        LOG_PATH: process.env.LOG_PATH || '/home/sam/logs/api.json',
        LOG_PRETTY: process.env.LOG_PRETTY || 'false',
      },
      error_file: '/home/sam/logs/api-err.log',
      out_file: '/home/sam/logs/api-out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
