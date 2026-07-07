import { defineConfig, devices } from '@playwright/test'

/**
 * README 用スクリーンショット生成専用の設定。
 * `npm run screenshot` で scripts/screenshot.spec.ts のみを実行する。
 */
export default defineConfig({
  testDir: './scripts',
  timeout: 120_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
