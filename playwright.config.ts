import { defineConfig, devices } from '@playwright/test';

const raw = process.env.BASE_URL;
if (!raw) throw new Error('BASE_URL is not set, e.g. BASE_URL=http://localhost:8000 npm test');
// Trailing slash so page.goto('./') stays under a sub-path like https://<user>.github.io/yk-site/
const baseURL = raw.endsWith('/') ? raw : `${raw}/`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
