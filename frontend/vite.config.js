import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
      },
      '/outputs': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
      },
      '/evidence': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
      }
    }
  }
})
