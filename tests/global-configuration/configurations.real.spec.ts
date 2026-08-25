import { test, expect } from "@playwright/test";
import { login } from "../helpers/commands.js";
import dbHelper from "../helpers/adminDbHelper.js";

test.describe("Global Configurations - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
  });

  test("should load configurations, modify in sandbox, and persist successfully", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/");

    const configPromise = page.waitForResponse("**/v1/configurations*");
    await page.getByRole("button", { name: "Configurations" }).first().click();
    await expect(page).toHaveURL(/.*configurations.*/);
    await configPromise;

    // Verify configurations are loaded
    await expect(page.locator("h1")).toHaveText("Global Configurations");
    
    const siteNameRow = page.locator("tr", { hasText: "general.site_name" });
    await expect(siteNameRow).toBeVisible();

    // Trigger edit modal
    await siteNameRow.locator('button[title="Edit setting"]').click();
    await expect(page.locator(".modal-title")).toHaveText("Edit Configuration");

    // Modify the value
    const input = page.locator('.modal-body input[type="text"]');
    const newSiteName = `VariaMos Real Test Name ${suffix}`;
    await input.fill(newSiteName);
    await page.click('button[type="submit"]');

    // Verify Sandbox state
    await expect(page.locator(".alert-warning")).toBeVisible();
    await expect(siteNameRow.locator(".badge", { hasText: "UNSAVED" })).toBeVisible();

    // Persist changes
    const savePromise = page.waitForResponse("**/v1/configurations/general.site_name");
    await page.click('button:has-text("Save Changes")');
    await savePromise;

    // Alert banner should be gone, and toast should display success
    await expect(page.locator(".alert-warning")).not.toBeVisible();
    await expect(page.locator(".toast")).toContainText("Successfully saved 1 configuration(s).");

    // Cleanup: Restore original site name
    await siteNameRow.locator('button[title="Edit setting"]').click();
    await input.fill("VariaMos");
    await page.click('button[type="submit"]');
    await page.click('button:has-text("Save Changes")');
    await page.waitForResponse("**/v1/configurations/general.site_name");
  });

  test.afterEach(async () => {
    await dbHelper.cleanTestUsers(suffix);
  });
});
