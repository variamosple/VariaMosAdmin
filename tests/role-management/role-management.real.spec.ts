import { test, expect } from "@playwright/test";
import { login } from "../helpers/commands.js";
import dbHelper from "../helpers/adminDbHelper.js";

test.describe("Role & Permission Management - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).replace(/[^a-z]/g, "").substring(0, 6);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";
  const customRoleName = `Test custom role ${suffix}`;

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
    await dbHelper.cleanTestRoles();
  });

  test("should create a new role, assign two permissions, and verify they persist on reload", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/");

    await page.getByText("Roles", { exact: true }).click();
    await expect(page).toHaveURL(/.*roles.*/);

    await page.getByRole("button", { name: "Create Role" }).click();
    await expect(page.locator(".modal-content")).toBeVisible();
    await page.locator('input[id="name"]').fill(customRoleName);
    const createPromise = page.waitForResponse(response => 
      response.url().includes("v1/roles") && response.request().method() === "POST"
    );
    await page.locator(".modal-footer").getByRole("button", { name: "Create role" }).click();
    await createPromise;

    const rolesPromise = page.waitForResponse("**/v1/roles?*");
    await page.locator('input[id="search"]').click();
    await page.locator('input[id="search"]').fill(customRoleName);
    await rolesPromise;

    await expect(page.locator("td", { hasText: customRoleName })).toBeVisible();

    const row = page.locator("tr", { hasText: customRoleName });
    await row.locator('button[title="See role details"]').click();

    await expect(page.locator("h1")).toHaveText(`${customRoleName} Role`);

    // Assign "users::query"
    await page.locator("button.form-select").click();
    await page.locator("button.form-select input").pressSequentially("users::query", { delay: 30 });
    await page.locator(".dropdown-menu button.dropdown-item", { hasText: "users::query" }).click();
    await page.getByRole("button", { name: "Add permission" }).click();
    await expect(page.locator("td", { hasText: "users::query" })).toBeVisible();

    // Assign "users::update"
    await page.locator("button.form-select").click();
    await page.locator("button.form-select input").press("Control+A");
    await page.locator("button.form-select input").press("Backspace");
    
    // Wait for input to register as empty and dropdown items to load
    await expect(page.locator("button.form-select input")).toHaveValue("");
    await page.locator(".dropdown-menu button.dropdown-item").first().waitFor({ state: "visible" });

    await page.locator("button.form-select input").pressSequentially("users::update", { delay: 30 });
    await page.locator(".dropdown-menu button.dropdown-item", { hasText: "users::update" }).click();
    await page.getByRole("button", { name: "Add permission" }).click();
    await expect(page.locator("td", { hasText: "users::update" })).toBeVisible();

    await page.reload();
    await expect(page.locator("h1")).toHaveText(`${customRoleName} Role`);
    await expect(page.locator("td", { hasText: "users::query" })).toBeVisible();
    await expect(page.locator("td", { hasText: "users::update" })).toBeVisible();
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestRoles();
    await dbHelper.cleanTestUsers(suffix);
  });
});
