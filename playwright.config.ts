import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — Phase 7 smoke tests.
 *
 * Tests live under `tests/e2e/` and run against `npm run start` (production
 * build). Local dev: run `npm run build` first, then `npm run test:e2e`.
 * CI: GitHub Actions builds + spins the server.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "fr-FR",
    timezoneId: "Africa/Tunis",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: "http://localhost:3000",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        env: { SKIP_ENV_VALIDATION: "1" },
      },
});
