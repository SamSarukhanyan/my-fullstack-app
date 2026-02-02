// ecosystem.config.cjs
require('dotenv').config({ path: './.env.production' });

module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './server/src',
      script: 'index.js',
      instances: "max",
      exec_mode: 'cluster',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.PORT || 4004,
      },
      env_production: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || 4004,
      },
      error_file: '/home/sam/logs/api-err.log',
      out_file: '/home/sam/logs/api-out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
