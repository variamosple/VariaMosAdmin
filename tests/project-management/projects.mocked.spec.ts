import { test, expect } from "@playwright/test";

test.describe("Project Management - Mocked Flows", () => {
  const mockProjects = [
    {
      id: "p1",
      name: "English Web Project",
      description: "A very long description that should be truncated by CSS styling in the table view to test text overflow handling",
      author: "Admin User",
      source: "Web Application Creator",
      date: "2026-07-20T10:00:00.000Z",
      template: true,
      project: {
        productLines: [
          {
            id: "pl-1",
            name: "Core PL",
            type: "software",
            domain: "education",
            domainEngineering: { models: [{ id: "m-1", name: "Domain model 1" }] },
            applicationEngineering: { models: [] }
          }
        ]
      }
    },
    {
      id: "p2",
      name: "Spanish Mobile Project",
      description: "Private test project",
      author: "Editor User",
      source: "Mobile app client",
      date: null,
      template: false,
      project: {}
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
              permissions: ["admin::projects::query"]
            }
          }
        })
      });
    });

    await page.route("**/v1/admin/projects*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mockProjects, totalItems: 2, totalPages: 1, currentPage: 1 })
      });
    });

    await page.goto("http://localhost:3000/#/projects");
  });

  test("should display projects table, fallback values, and accordion details", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Projects list");
    await expect(page.locator("table")).toBeVisible();

    const row1 = page.locator("tr", { hasText: "English Web Project" });
    await expect(row1).toContainText("Admin User");
    await expect(row1).toContainText("Web Application Creator");
    await expect(row1).toContainText("Public");
    await expect(row1).toContainText("2026-07-20");

    const row2 = page.locator("tr", { hasText: "Spanish Mobile Project" });
    await expect(row2).toContainText("Private");
    await expect(row2.locator("td").nth(4)).toBeEmpty();

    await row1.locator('button[title="Show/Hide project details"]').click();
    await page.getByRole("button", { name: "Product Line: Core PL - Type: software - Domain: education" }).click();
    await page.getByRole("button", { name: "Domain Engineering - Models" }).click();
    await expect(page.getByText("Domain model 1")).toBeVisible();
  });

  test("should support dynamic query filtering via SearchForm", async ({ page }) => {
    await page.route("**/v1/admin/projects?*name=Spanish*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [mockProjects[1]], totalItems: 1, totalPages: 1, currentPage: 1 })
      });
    });

    await page.locator('input[id="name"]').fill("Spanish");
    await expect(page.locator("tr", { hasText: "Spanish Mobile Project" })).toBeVisible();
    await expect(page.locator("tr", { hasText: "English Web Project" })).not.toBeVisible();
  });

  test("should inspect edit modal fields, trigger validation, and submit updates", async ({ page }) => {
    const row = page.locator("tr", { hasText: "English Web Project" });
    await row.locator('button[title="Edit project"]').click();

    await expect(page.locator(".modal-title")).toHaveText("Edit a Project");
    const nameInput = page.locator('.modal input[placeholder="Project name"]');
    await expect(nameInput).toHaveValue("English Web Project");

    await nameInput.clear();
    await page.locator(".modal button").getByText("Edit project", { exact: true }).click();
    await expect(page.getByText("Project name is required")).toBeVisible();

    await nameInput.fill("English Web Project Updated");

    await page.route("**/v1/admin/projects/p1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { ...mockProjects[0], name: "English Web Project Updated" } })
      });
    });

    await page.locator(".modal button").getByText("Edit project", { exact: true }).click();
    await expect(page.locator(".modal-title")).not.toBeVisible();
  });
});