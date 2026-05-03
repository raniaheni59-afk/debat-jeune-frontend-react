import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy Error:', err);
          });
        },
      },
    },
  },
  // ✅ تقليل استهلاك الذاكرة
  build: {
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    force: false,
  }
})