import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// The pages in a real browser (NEXTJS-PLAN.md, step 2), against the built release as the container
// runs it (node server.js). build.sh runs this after `next build`; alone: `npx playwright test`
// after build.sh (or EXAMPREP_RELEASE=dir); E2E_BASE_URL=https://... tests a running server.
const release = process.env.EXAMPREP_RELEASE || fileURLToPath(new URL('./release', import.meta.url));
const port = Number(process.env.E2E_PORT || 4199);
// E2E_BASE_URL: run against a server that is already up (the container, the test host) instead
const base = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'line' : [['line']],
  use: { baseURL: base || `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'phone-320', use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
  webServer: base ? undefined : {
    command: 'node server.js',
    cwd: release,
    url: `http://127.0.0.1:${port}/`,
    env: { PORT: String(port), HOSTNAME: '127.0.0.1', NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
