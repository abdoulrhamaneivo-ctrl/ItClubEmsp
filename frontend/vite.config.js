import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    host: true,
    port: 5200
  },
  preview: {
    host: true,
    port: 5200
  },
  build: {
    // Découpage des vendors : cache navigateur efficace (les libs changent rarement)
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          motion: ['framer-motion'],
          lucide: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
