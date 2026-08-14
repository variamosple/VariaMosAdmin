import { test, expect } from "@playwright/test";
import { login } from "../helpers/commands.js";
import dbHelper from "../helpers/adminDbHelper.js";

test.describe("Project Management - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
    await dbHelper.seedTestModels(suffix);
  });

  test("should show seeded project, update project name, and delete it", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/");

    const projectsPromise = page.waitForResponse("**/v1/admin/projects*");
    await page.getByText("Projects", { exact: true }).click();
    await expect(page).toHaveURL(/.*projects.*/);
    await projectsPromise;

    const searchPromise = page.waitForResponse(response => 
      response.url().includes("v1/admin/projects") && response.url().includes(suffix)
    );
    await page.locator('input[id="name"]').click();
    await page.locator('input[id="name"]').fill(`Test Custom Project-${suffix}`);
    await searchPromise;

    await expect(page.locator("tr", { hasText: `Test Custom Project-${suffix}` })).toBeVisible();

    const row = page.locator("tr", { hasText: `Test Custom Project-${suffix}` });
    await row.locator('button[title="Edit project"]').click();

    await expect(page.locator(".modal-title")).toHaveText("Edit a Project");
    await page.locator('.modal input[placeholder="Project name"]').fill(`Test Custom Project-${suffix} Edited`);
    
    const editPromise = page.waitForResponse("**/v1/admin/projects/*");
    await page.locator(".modal-footer").getByRole("button", { name: "Edit project" }).click();
    await editPromise;
    await expect(page.locator(".modal-title")).not.toBeVisible();

    await expect(page.locator("tr", { hasText: `Test Custom Project-${suffix} Edited` })).toBeVisible();

    const updatedRow = page.locator("tr", { hasText: `Test Custom Project-${suffix} Edited` });
    await updatedRow.locator('button[title="Delete project"]').click();

    const confirmModal = page.locator(".modal", { hasText: "Are you sure you want to delete the project?" });
    
    const deletePromise = page.waitForResponse("**/v1/admin/projects/*");
    await confirmModal.getByRole("button", { name: "Accept" }).click();
    await deletePromise;

    await expect(page.locator("tr", { hasText: `Test Custom Project-${suffix} Edited` })).not.toBeVisible();
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestModels(suffix);
    await dbHelper.cleanTestUsers(suffix);
  });
});