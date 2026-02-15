module.exports = {
  apps: [
    {
      name: 'ebay-live-service',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=4096',
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'dist',
        'coverage',
        '.git'
      ],
      watch_options: {
        followSymlinks: false
      },
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000,
      merge_logs: true,
      autorestart: true,
      cron_restart: '0 2 * * *',
      max_memory_restart: '1G'
    }
  ]
};