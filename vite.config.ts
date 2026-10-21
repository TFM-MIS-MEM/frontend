/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  // 5173 en el anfitrión, el mismo que publica el contenedor: el origen del
  // panel no cambia entre `pnpm dev` y la demo.
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    // Node 25+ define su propio `localStorage` global, que sin
    // --localstorage-file vale undefined y tapa el de jsdom.
    poolOptions: { forks: { execArgv: ['--no-experimental-webstorage'] } },
  },
})
