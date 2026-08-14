import { test, expect } from "@playwright/test";
import { login } from "../helpers/commands.js";
import dbHelper from "../helpers/adminDbHelper.js";

test.describe("Language Management - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
    await dbHelper.seedTestLanguages(suffix);
  });

  test("should show seeded languages, update a language, and delete another", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/");

    const languagesPromise = page.waitForResponse("**/v1/admin/languages*");
    await page.getByRole("button", { name: "Languages" }).first().click();
    await expect(page).toHaveURL(/.*languages.*/);
    await languagesPromise;

    // Filter table by unique suffix so the seeded languages are on page 1
    const searchPromise = page.waitForResponse(response => 
      response.url().includes("v1/admin/languages") && response.url().includes("name=" + suffix)
    );
    await page.locator('input[id="name"]').fill(suffix);
    await searchPromise;

    await expect(page.locator("tbody tr", { hasText: `Test Custom Language-Active-${suffix}` })).toBeVisible();
    await expect(page.locator("tbody tr", { hasText: `Test Custom Language-Pending-${suffix}` })).toBeVisible();

    const activeRow = page.locator("tbody tr", { hasText: `Test Custom Language-Active-${suffix}` });
    await activeRow.locator('button[title="Edit language"]').click();

    await expect(page.locator(".modal-title")).toHaveText("Edit a Language");
    await page.locator('.modal input[placeholder="Language name"]').fill(`Test Custom Language-Active-${suffix} Edited`);
    await page.locator('.modal select[aria-label="State"]').selectOption("PENDING");

    await page.locator(".modal-footer").getByRole("button", { name: "Edit language" }).click();
    await expect(page.locator(".modal-title")).not.toBeVisible();

    const updatedRow = page.locator("tbody tr", { hasText: `Test Custom Language-Active-${suffix} Edited` });
    await expect(updatedRow.locator("td").nth(2)).toHaveText("PENDING");

    const pendingRow = page.locator("tbody tr", { hasText: `Test Custom Language-Pending-${suffix}` });
    await pendingRow.locator('button[title="Delete language"]').click();

    const confirmModal = page.locator(".modal", { hasText: "Are you sure you want to delete the language?" });
    await confirmModal.getByRole("button", { name: "Accept" }).click();

    await expect(page.locator("tbody tr", { hasText: `Test Custom Language-Pending-${suffix}` })).not.toBeVisible();
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestLanguages(suffix);
    await dbHelper.cleanTestUsers(suffix);
  });
});