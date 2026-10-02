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
    test.setTimeout(60000); // Docker API discovery can take a while on Github Actions

    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/");

    await page.getByRole("button", { name: "Monitoring" }).first().click();
    await expect(page).toHaveURL(/.*monitoring.*/);

    await expect(page.locator("h1")).toHaveText("Microservices & System Status");

    const adminRow = page.locator("tr", { hasText: "Admin Service" });
    await expect(adminRow.locator("td").nth(1)).toHaveText(/up/i, { timeout: 30000 });
    await expect(adminRow.locator('button[title="Stop Service"]')).toBeVisible();
    await expect(adminRow.locator('button[title="Restart Service"]')).toBeVisible();

    const langRow = page.locator("tr", { hasText: "Languages Service" });
    await expect(langRow.locator("td").nth(1)).toHaveText(/up/i, { timeout: 30000 });
    await expect(langRow.locator('button[title="Stop Service"]')).toBeVisible();
    await expect(langRow.locator('button[title="Restart Service"]')).toBeVisible();
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestUsers(suffix);
  });
});