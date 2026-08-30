/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Servi depuis https://<user>.github.io/badminton-hub/ en production (GitHub
// Pages, site de projet), et depuis la racine du serveur en développement local.
const base = process.env.GITHUB_PAGES ? '/badminton-hub/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
