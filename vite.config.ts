import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves project sites below /<repository>/.
  base: '/ledgerforge/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
