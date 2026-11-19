// vite.config.js - Configuración de compilación y servidor de desarrollo Vite para BeaverVault
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Configuración principal de Vite
export default defineConfig({
  // Plugins integrados: React (Fast Refresh / JSX) y Tailwind CSS v4
  plugins: [react(), tailwindcss()],

  // Configuración del servidor de desarrollo local
  server: {
    // Proxy inverso para redirigir peticiones API al backend local en puerto 3000
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
