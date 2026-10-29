import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 20000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // A test that passes only on a retry fails the run: the retry gives its
  // trace, it does not hide it (TST-FRONT-09)
  failOnFlakyTests: !!process.env.CI,
  workers: process.env.PLAYWRIGHT_WORKERS
    ? Number(process.env.PLAYWRIGHT_WORKERS)
    : (process.env.CI ? 1 : undefined),
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // Edge is not in the Playwright image: its CI job runs it alone, on the
  // runner where it is installed (PLAYWRIGHT_EDGE=1)
  projects:
    process.env.PLAYWRIGHT_EDGE === "1"
      ? [
          {
            name: "msedge",
            use: { ...devices["Desktop Edge"], channel: "msedge" },
          },
        ]
      : [
          {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
          },
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
          },
        ],
  webServer: {
    command: "npm run preview -- --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
