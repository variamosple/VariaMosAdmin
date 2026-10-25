import { test, expect } from "@playwright/test";
import { login } from "../helpers/commands.js";
import dbHelper from "../helpers/adminDbHelper.js";

test.describe("Monitoring - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
  });

  test("should query local microservices and verify they are running", async ({ page }) => {
    test.setTimeout(180000); // Docker API discovery and the readiness wait can take a while on Github Actions

    await login(page, adminEmail, adminPassword);

    // Services boot in parallel with the stack, and the health collector only
    // reports them after its first probes. Wait until a probe has been recorded
    // and reported UP, so the assertions below do not race the first health cycle.
    await expect
      .poll(
        async () => {
          const res = await page.request.get("http://localhost:4000/v1/micro-services?page=1&limit=20");
          const body = await res.json();
          return ["Admin Service", "Languages Service"].every((name) => {
            // UP now means a probe was recorded: before it, the status is NO_DATA (EV-106).
            const health = body.data?.find((s: { displayName: string }) => s.displayName === name)?.health;
            return health?.status === "UP";
          });
        },
        { timeout: 120000, intervals: [3000] },
      )
      .toBe(true);

    await page.goto("http://localhost:3000/variamos_admin/");

    page.on("response", async (response) => {
      // The API only: the page's own file is named microservices-*.js (T-30)
      if (response.url().includes("/v1/micro-services") || response.url().includes("/health")) {
        console.log(`[API] ${response.url()} - ${response.status()}`);
        try {
          const body = await response.text();
          console.log(`[API BODY] ${body}`);
        } catch (e) {
          console.log(`[API BODY ERROR] Could not read body`);
        }
      }
    });

    await page.getByRole("button", { name: "Monitoring" }).first().click();
    await expect(page).toHaveURL(/.*monitoring.*/);

    await expect(page.locator("h1")).toHaveText("Microservices & System Status");

    try {
      const adminRow = page.locator("tr", { hasText: "Admin Service" });
      await expect(adminRow.locator("td").nth(1)).toHaveText(/up/i, { timeout: 30000 });
      await expect(adminRow.locator('button[title="Stop Service"]')).toBeVisible();
      await expect(adminRow.locator('button[title="Restart Service"]')).toBeVisible();

      const langRow = page.locator("tr", { hasText: "Languages Service" });
      await expect(langRow.locator("td").nth(1)).toHaveText(/up/i, { timeout: 30000 });
      await expect(langRow.locator('button[title="Stop Service"]')).toBeVisible();
      await expect(langRow.locator('button[title="Restart Service"]')).toBeVisible();
    } catch (error) {
      console.error("Test failed, dumping diagnostic info...");
      try {
        const tableContent = await page.locator("table").innerText({ timeout: 2000 });
        console.error("=== TABLE CONTENT ===");
        console.error(tableContent);
      } catch (e) {
        console.error("Could not get table content", e);
      }
      try {
        const bodyContent = await page.locator("body").innerText({ timeout: 2000 });
        console.error("=== BODY CONTENT ===");
        console.error(bodyContent);
      } catch (e) {
        console.error("Could not get body content", e);
      }
      throw error;
    }
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestUsers(suffix);
  });
});