import { defineConfig, devices } from "@playwright/test";
import { E2E } from "./harness/ports.js";

const skipBuild = process.env.E2E_SKIP_BUILD === "1";
const webEnv = { API_INTERNAL_URL: `http://127.0.0.1:${E2E.apiPort}`, NEXT_TELEMETRY_DISABLED: "1" };

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never", outputFolder: "playwright-report" }]] : [["list"]],
  use: {
    baseURL: E2E.webUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"], testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, dependencies: ["setup"], testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: [
    {
      command: "pnpm exec tsx harness/api.ts",
      url: `http://127.0.0.1:${E2E.apiPort}/api/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: skipBuild ? `pnpm --filter @tokeniq/web exec next start --port ${E2E.webPort}` : `pnpm --filter @tokeniq/web exec next build && pnpm --filter @tokeniq/web exec next start --port ${E2E.webPort}`,
      url: `${E2E.webUrl}/`,
      timeout: 600_000,
      reuseExistingServer: false,
      env: webEnv,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
