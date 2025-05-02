import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://192.168.1.40:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api') // Ensure /api prefix is preserved
      },
      '/auth': {
        target: 'http://192.168.1.40:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
