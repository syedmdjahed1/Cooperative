import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Vercel (and some tools) only allow lowercase env names — map to VITE_API_URL at build time. */
const apiBase = (
  process.env.vite_api_url ||
  process.env.VITE_API_URL ||
  ''
).trim();

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(apiBase),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
