/// <reference types="vitest/config" />
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Three independent pages: the hub, the single-recipe viewer and the tap
    // list. Each gets its own HTML entry and bundle — there is no router.
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        recipe: resolve(import.meta.dirname, 'recipe.html'),
        robinete: resolve(import.meta.dirname, 'robinete.html'),
      },
    },
  },
  test: {
    // Parser-only tests: they run in Node against fixtures/, no DOM needed.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
