module.exports = {
    apps: [{
      name: 'aphians-server',
      script: 'src/index.js',
      cwd: '/home/mukul/Documents/src/aphians/server',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_file: '/home/mukul/Documents/src/aphians/server/.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }]
  };