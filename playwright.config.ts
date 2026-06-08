import { defineConfig } from '@playwright/test'

const PORT = process.env.TEST_PORT ?? '3333'
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    headless: true,
  },
  webServer: {
    command: `PORT=${PORT} npm run dev`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
  // Run tests serially to avoid session conflicts with shared in-memory store
  workers: 1,
})
