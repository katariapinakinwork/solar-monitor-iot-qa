import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const baseURL = process.env.BASE_URL ?? 'http://localhost:8080';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['fixtures/**/*.ts', 'hooks/**/*.ts', 'steps/**/*.ts'],
});

export default defineConfig({
  testDir,
  globalSetup: './global-setup.ts',

  // shared database, so no parallel runs
  workers: 1,
  fullyParallel: false,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});