import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react() ,  tailwindcss()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  server: {
    // Bind to all interfaces so it's reachable via localhost and LAN IP
    host: true, // equivalent to '0.0.0.0'
    port: 5173,
    strictPort: true,
    // Ensure HMR works reliably on Windows
    hmr: { host: 'localhost' }
  },
  // Keep preview behavior consistent with dev for quick local checks
  preview: {
    host: true,
    port: 5173,
    strictPort: true
  }
})