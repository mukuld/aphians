import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    // base: '',
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: true,
      proxy: {
        '/aphians/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/aphians\/api/, '/api')
        },
        '/aphians/auth': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/aphians\/auth/, '/auth')
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    }
  });