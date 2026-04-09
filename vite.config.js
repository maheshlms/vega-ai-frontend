import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js']
    },

    server: {
      host: true,
      port: 5173,
      strictPort: true,

      hmr: {
        host: env.VITE_HMR_HOST || 'localhost'
      },

      proxy: {
        // ✅ EXISTING HeyGen proxy (DO NOT TOUCH)
        '/heygen-api': {
          target: 'https://api.heygen.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/heygen-api/, ''),
        },

        // 🔥 FIXED LiveAvatar proxy (THIS IS THE IMPORTANT PART)
        '/liveavatar-api': {
  target: 'https://api.liveavatar.com',
  changeOrigin: true,
  secure: true,
  rewrite: (path) => path.replace(/^\/liveavatar-api/, '/v1'),
},

        // ✅ Backend API proxy
        '/api/v1': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path,
        }
      }
    },

    preview: {
      host: true,
      port: 5173,
      strictPort: true
    }
  }
})