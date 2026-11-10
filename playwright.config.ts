import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './examples/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5199',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'pnpm exec vite --config examples/e2e/vite.config.ts --host 127.0.0.1 --port 5199 --strictPort',
    url: 'http://127.0.0.1:5199/e2e/fixtures/search-form-lab.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
