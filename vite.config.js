import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash]-[date].js',
        chunkFileNames: 'assets/[name]-[hash]-[date].js',
        assetFileNames: 'assets/[name]-[hash]-[date].[ext]',
      }
    }
  },
  optimizeDeps: {
    force: false,
  }
})
