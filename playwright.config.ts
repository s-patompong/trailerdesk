import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // Local tests share one loopback IP and intentionally keep Better Auth's limits on.
  workers: 1,
  timeout: 60000,
  use: { baseURL: "http://app.localhost:5174", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://app.localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
