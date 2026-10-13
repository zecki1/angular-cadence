import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright — configuração de testes E2E (pt-BR).
 *
 * Roda na CI e localmente. Por padrão o Playwright sobe o `ng serve` na 4200,
 * mas `E2E_BASE_URL` aponta a suíte para um servidor já em execução (útil para
 * rodar em uma porta dedicada sem disputar a 4200 com outras sessões).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : 2,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env['CI']
    ? [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list']]
    : 'list',
  use: {
    baseURL: process.env['E2E_BASE_URL'] || 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    reducedMotion: 'no-preference',
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'npm start',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
      },
});
