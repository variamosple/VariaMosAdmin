import { test, expect } from "@playwright/test";
import { login } from "../helpers/commands.js";
import dbHelper from "../helpers/adminDbHelper.js";

test.describe("Model Management - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
    await dbHelper.seedTestModels(suffix);
  });

  test("should show seeded model, expand details, and edit the model name", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/");

    const modelsPromise = page.waitForResponse("**/v1/admin/models*");
    await page.getByRole("button", { name: "Models" }).first().click();
    await expect(page).toHaveURL(/.*models.*/);
    await modelsPromise;

    // Filter table by unique suffix so the seeded model is on page 1
    const searchInput = page.locator('input[placeholder="Search by model name or project name"]');
    await expect(searchInput).toBeVisible();

    const searchPromise = page.waitForResponse(response => 
      response.url().includes("v1/admin/models") && response.url().includes(suffix)
    );
    await searchInput.pressSequentially(`${suffix}`, { delay: 50 });
    await searchPromise;

    const row = page.locator("tbody tr", { hasText: `Test Custom Model-${suffix}` }).first();
    await expect(row).toBeVisible();

    await row.locator('button[title="Show/Hide model details"]').click();
    await expect(page.locator("div.row", { hasText: "Project" }).getByText(`Test Custom Project-${suffix}`)).toBeVisible();

    await row.locator('button[title="Edit model"]').click();
    await expect(page.locator(".modal-title")).toHaveText("Edit a Model");

    await page.locator('.modal input[placeholder="Model name"]').fill(`Test Custom Model-${suffix} Edited`);
    await page.locator(".modal-footer").getByRole("button", { name: "Edit model" }).click();

    await expect(page.locator(".modal-title")).not.toBeVisible();
    await expect(page.locator("tbody tr", { hasText: `Test Custom Model-${suffix} Edited` }).first()).toBeVisible();
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestModels(suffix);
    await dbHelper.cleanTestUsers(suffix);
  });
});
