import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Im headed mode (lokal): slowMo damit man alles verfolgen kann
const isHeaded = process.argv.includes('--headed');

const authFile = path.join(process.cwd(), '.playwright/auth/user.json');

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',

  // Plan-Generierung kann 60-90s dauern → großzügiger Timeout
  timeout: 120 * 1000,

  // Erwartungs-Timeout (erhöht für Laden von Daten aus DB)
  expect: {
    timeout: 15 * 1000,
  },

  // Retry failed tests
  retries: process.env.CI ? 2 : 0,

  // Sequenziell lokal (einfacher zu verfolgen), parallel in CI
  workers: process.env.CI ? 2 : 1,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    // Im headed mode: 800ms zwischen Actions – man kann alles verfolgen
    launchOptions: {
      slowMo: isHeaded ? 800 : 0,
    },
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  projects: [
    // 1. Setup: einmal einloggen, Session speichern
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // 2. Tests: nutzen gespeicherten Auth-State
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },

    // Firefox nur lokal (spart CI-Zeit)
    ...(process.env.CI ? [] : [
      {
        name: 'firefox',
        use: {
          ...devices['Desktop Firefox'],
          storageState: authFile,
        },
        dependencies: ['setup'],
      },
    ]),
  ],

  // Reporter
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['junit', { outputFile: 'test-results/junit.xml' }]] : []),
  ],
});
