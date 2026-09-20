import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual-storybook',
  outputDir: './test-results/visual-storybook',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['line'],
    [
      'html',
      {
        outputFolder: 'playwright-report/visual-storybook',
        open: 'never',
      },
    ],
  ],
  snapshotPathTemplate:
    '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.001,
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:6006',
    colorScheme: 'light',
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-linux',
      use: {
        browserName: 'chromium',
        colorScheme: 'light',
      },
    },
    {
      name: 'chromium-dark',
      use: {
        browserName: 'chromium',
        colorScheme: 'dark',
      },
    },
  ],
  webServer: {
    command: 'npx http-server storybook-static -p 6006 -a 127.0.0.1 --silent',
    url: 'http://127.0.0.1:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});