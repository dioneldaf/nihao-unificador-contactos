import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El endpoint (webhook n8n) no devuelve cabeceras CORS, así que el navegador no puede
// llamarlo directamente. Proxyeamos /api -> https://automatizaciones.nihao53.com/webhook
// (https para evitar el redirect 301 de http).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://automatizaciones.nihao53.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api/, '/webhook'),
      },
    },
  },
})
