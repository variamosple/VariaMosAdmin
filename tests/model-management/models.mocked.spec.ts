import { test, expect } from "@playwright/test";

test.describe("Model Management - Mocked Flows", () => {
  const mockModels = [
    {
      id: "1",
      name: "First Model",
      description: "This is the first mock model",
      author: "Author One",
      source: "Source One",
      engineeringType: "domain",
      projectName: "Project One",
      owners: [{ id: "admin1", name: "Admin User", email: "admin@example.com", accessLevel: "OWNER" }]
    },
    {
      id: "2",
      name: "Second Model",
      description: "This is the second mock model",
      author: "Author Two",
      source: "Source Two",
      engineeringType: "application",
      projectName: "Project Two",
      owners: []
    }
  ];

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
              permissions: ["admin::models::query"]
            }
          }
        })
      });
    });

    await page.route("**/v1/admin/models*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mockModels, totalItems: 2, totalPages: 1, currentPage: 1 })
      });
    });

    await page.goto("http://localhost:3000/#/models");
  });

  test("should display models list with correct headers, rows, and allow details expansion", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Models list");
    await expect(page.locator("table")).toBeVisible();

    const row = page.locator("tr", { hasText: "First Model" });
    await expect(row).toContainText("This is the first mock model");
    await expect(row).toContainText("Author One");
    await expect(row).toContainText("Source One");
    await expect(row).toContainText("domain");
    await expect(row).toContainText("Project One");

    await row.locator('button[title="Show/Hide model details"]').click();
    await expect(page.locator("div.row", { hasText: "Owners" }).getByText("Admin User (admin@example.com)")).toBeVisible();

    await row.locator('button[title="Show/Hide model details"]').click();
    await expect(page.locator("div.row", { hasText: "Owners" }).getByText("Admin User (admin@example.com)")).not.toBeVisible();
  });

  test("should perform dynamic filtering using debounced search field", async ({ page }) => {
    await page.route("**/v1/admin/models?*name=First*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [mockModels[0]], totalItems: 1, totalPages: 1, currentPage: 1 })
      });
    });

    await page.locator('input[placeholder="Search by model name or project name"]').fill("First");
    await expect(page.locator("tr", { hasText: "First Model" })).toBeVisible();
    await expect(page.locator("tr", { hasText: "Second Model" })).not.toBeVisible();
  });

  test("should inspect modal validation and trigger successful update", async ({ page }) => {
    const row = page.locator("tr", { hasText: "First Model" });
    await row.locator('button[title="Edit model"]').click();

    await expect(page.locator(".modal-title")).toHaveText("Edit a Model");
    const input = page.locator('.modal input[placeholder="Model name"]');
    await expect(input).toHaveValue("First Model");

    await input.clear();
    await page.locator(".modal-footer").getByRole("button", { name: "Edit model" }).click();
    await expect(page.getByText("Model name is required")).toBeVisible();

    await input.fill("First Model Edited");

    await page.route("**/v1/admin/models/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { ...mockModels[0], name: "First Model Edited" } })
      });
    });

    await page.locator(".modal-footer").getByRole("button", { name: "Edit model" }).click();
    await expect(page.locator(".modal-title")).not.toBeVisible();
  });
});