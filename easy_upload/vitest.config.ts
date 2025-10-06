/// <reference types="@vitest/browser/providers/webdriverio" />
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    testTimeout: 180_000,
  },
})
