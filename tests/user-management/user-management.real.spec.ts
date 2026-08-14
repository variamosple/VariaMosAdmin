import { test, expect } from "@playwright/test";
import { login } from "../helpers/commands.js";
import dbHelper from "../helpers/adminDbHelper.js";

test.describe("User Management - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";
  const targetUserEmail = `user-test-${suffix}@variamos-test.com`;

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
  });

  test("should toggle active/disabled states for a test user, verifying UI updates and database persistence", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/");

    await page.getByText("Users", { exact: true }).click();
    await expect(page).toHaveURL(/.*users.*/);

    const searchPromise = page.waitForResponse("**/v1/users?*");
    await page.locator('input[id="search"]').fill(targetUserEmail);
    await searchPromise;

    const row = page.locator("tr", { hasText: targetUserEmail });
    await expect(row.locator("td").nth(3)).toHaveText("active");

    const disablePromise = page.waitForResponse("**/v1/users/*/disable");
    await row.locator('button[title="Disable user"]').click();
    await page.getByRole("button", { name: "Accept" }).click();
    await disablePromise;

    await expect(row.locator("td").nth(3)).toHaveText("disabled");

    const dbStateDisabled = await dbHelper.getUserState(targetUserEmail);
    expect(dbStateDisabled.isenabled).toBeFalsy();

    const enablePromise = page.waitForResponse("**/v1/users/*/enable");
    await row.locator('button[title="Enable user"]').click();
    await page.getByRole("button", { name: "Accept" }).click();
    await enablePromise;

    await expect(row.locator("td").nth(3)).toHaveText("active");

    const dbStateEnabled = await dbHelper.getUserState(targetUserEmail);
    expect(dbStateEnabled.isenabled).toBeTruthy();
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestUsers(suffix);
  });
});