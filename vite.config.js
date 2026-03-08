import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js']
    },
    server: {
      // Bind to all interfaces so it's reachable via localhost and LAN IP
      host: true, // equivalent to '0.0.0.0'
      port: 5173,
      strictPort: true,
      // Ensure HMR works reliably on Windows
      //hmr: { host: env.VITE_HMR_HOST || 'localhost' },
      hmr: { host: env.VITE_HMR_HOST  },
      proxy: {
        // Forwards /heygen-api/* → https://api.heygen.com/* server-side
        // This bypasses CORS completely — no third-party proxy needed
        '/heygen-api': {
          target: 'https://api.heygen.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/heygen-api/, ''),
        },
        // Proxy API requests to backend
        '/api/v1': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    },
    // Keep preview behavior consistent with dev for quick local checks
    preview: {
      host: true,
      port: 5173,
      strictPort: true
    }
  }
})
