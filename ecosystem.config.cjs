// ecosystem.config.cjs
require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './server',
      script: 'index.js',
      instances: "max",
      exec_mode: 'cluster',
      env: {
       NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
      },
      env_production: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
      },
      error_file: '/home/sam/logs/api-err.log',
      out_file: '/home/sam/logs/api-out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};