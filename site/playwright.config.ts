import { defineConfig, devices } from '@playwright/test';

// Par défaut, les tests tournent sur le serveur de dev local (démarré automatiquement).
// Pour tester une Deploy Preview ou la production :
//   BASE_URL=https://deploy-preview-3--loisir66.netlify.app bun run test:e2e
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const local = !process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: local
    ? {
        command: 'astro dev --host 127.0.0.1 --port 4321',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
