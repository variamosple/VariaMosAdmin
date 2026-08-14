import { test, expect } from "@playwright/test";

test.describe("Role & Permission Management - Mocked Flows", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    await page.route("**/auth/session-info", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            user: {
              id: "admin1",
              user: "admin",
              name: "Admin User",
              email: "admin@example.com",
              roles: ["Admin"],
              permissions: ["permissions::query", "roles::query", "roles::update"]
            }
          }
        })
      });
    });
  });

  test.describe("Permission List", () => {
    const mockPermissions = [
      { id: 1, name: "users::query" },
      { id: 2, name: "users::update" },
      { id: 3, name: "roles::query" }
    ];

    test.beforeEach(async ({ page }) => {
      await page.route("**/v1/permissions*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: mockPermissions, totalItems: 3, totalPages: 1, currentPage: 1 })
        });
      });

      await page.goto("http://localhost:3000/#/permissions");
    });

    test("should display permissions and allow searching", async ({ page }) => {
      await expect(page.locator("h1")).toHaveText("Permissions list");
      await expect(page.locator("td", { hasText: "users::query" })).toBeVisible();
      await expect(page.locator("td", { hasText: "roles::query" })).toBeVisible();

      await page.route("**/v1/permissions?*name=update*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [mockPermissions[1]], totalItems: 1, totalPages: 1, currentPage: 1 })
        });
      });

      await page.locator('input[id="search"]').fill("update");
      await expect(page.locator("td", { hasText: "users::update" })).toBeVisible();
      await expect(page.locator("td", { hasText: "users::query" })).not.toBeVisible();
    });
  });

  test.describe("Role List & Form Modal", () => {
    test.beforeEach(async ({ page }) => {
      await page.route("**/v1/roles*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [{ id: 10, name: "Administrator" }, { id: 11, name: "Developer" }], totalItems: 2, totalPages: 1, currentPage: 1 })
        });
      });

      await page.goto("http://localhost:3000/#/roles");
    });

    test("should validate create role dialog input and handle errors", async ({ page }) => {
      await page.getByRole("button", { name: "Create Role" }).click();
      await expect(page.locator(".modal-title")).toHaveText("Create a Role");

      await page.locator('.modal-footer button[type="submit"]').click();
      await expect(page.getByText("Role name is required")).toBeVisible();

      await page.route("**/v1/roles", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ errorCode: 400, message: "Role name already exists" })
        });
      });

      await page.locator('input[id="name"]').fill("Administrator");
      await page.locator('.modal-footer button[type="submit"]').click();

      await expect(page.locator(".modal-title")).toBeVisible();

      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.locator(".modal-title")).not.toBeVisible();
    });
  });
});