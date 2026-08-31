import { test, expect } from "@playwright/test";
import { login } from "../helpers/commands.js";
import dbHelper from "../helpers/adminDbHelper.js";

test.describe("Notifications Admin - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeEach(async () => {
    // Seed admin user with notifications permissions
    await dbHelper.seedTestUsers(suffix);
  });

  test("should login, navigate to notifications admin page, and broadcast notification successfully", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/#/admin/notifications");

    // Verify page loads
    await expect(page.locator("h4")).toContainText("Manual Notifications Dashboard");

    // Fill form
    await page.fill('input[placeholder="e.g., Scheduled Maintenance Alert"]', `E2E Live Broadcast ${suffix}`);
    await page.fill('textarea[placeholder="Enter the notification message here..."]', "This is a real live broadcast test message.");

    // Intercept API call to verify real request
    const dispatchPromise = page.waitForResponse("**/v1/admin/notifications/dispatch");
    await page.click('button[type="submit"]');
    const response = await dispatchPromise;
    if (response.status() !== 200) {
      console.error("DISPATCH FAILED:", response.status(), await response.text());
    }
    expect(response.status()).toBe(200);

    // Verify success banner is shown
    await expect(page.locator(".alert-success")).toContainText("Notifications dispatched successfully!");
  });
});
