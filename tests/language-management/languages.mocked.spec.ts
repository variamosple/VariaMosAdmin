import { test, expect } from "@playwright/test";

test.describe("Language Management - Mocked Flows", () => {
  const mockLanguages = [
    {
      id: 1,
      name: "English",
      type: "VariaMos",
      stateAccept: "ACTIVE",
      createdAt: "2026-07-20T10:00:00.000Z",
      updatedAt: "2026-07-20T11:00:00.000Z",
      owners: [{ id: "admin1", name: "Admin User", email: "admin@example.com", accessLevel: "OWNER" }]
    },
    {
      id: 2,
      name: "Spanish",
      type: "VariaMos",
      stateAccept: "PENDING",
      createdAt: undefined,
      updatedAt: undefined,
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
              permissions: ["admin::languages::query"]
            }
          }
        })
      });
    });

    await page.route("**/v1/admin/languages*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockLanguages,
          totalItems: 2,
          totalPages: 1,
          currentPage: 1
        })
      });
    });

    await page.goto("http://localhost:3000/#/languages");
  });

  test("should display languages list with correct headers, rows, and fallback for null dates", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Languages list");
    await expect(page.locator("table")).toBeVisible();

    const englishRow = page.locator("tr", { hasText: "English" });
    await expect(englishRow.locator("td").nth(1)).toHaveText("VariaMos");
    await expect(englishRow.locator("td").nth(2)).toHaveText("ACTIVE");
    await expect(englishRow.locator("td").nth(3)).toHaveText("Admin User");
    await expect(englishRow.locator("td").nth(4)).toContainText("2026-07-20");

    const spanishRow = page.locator("tr", { hasText: "Spanish" });
    await expect(spanishRow.locator("td").nth(2)).toHaveText("PENDING");
    await expect(spanishRow.locator("td").nth(4)).toHaveText("N/A");
    await expect(spanishRow.locator("td").nth(5)).toHaveText("N/A");
  });

  test("should perform dynamic filtering using debounced search field", async ({ page }) => {
    await page.route("**/v1/admin/languages?*name=Eng*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [mockLanguages[0]], totalItems: 1, totalPages: 1, currentPage: 1 })
      });
    });

    const searchPromise = page.waitForResponse("**/v1/admin/languages?*name=Eng*");
    await page.locator('input[id="name"]').fill("Eng");
    await searchPromise;

    await expect(page.locator("tr", { hasText: "English" })).toBeVisible();
    await expect(page.locator("tr", { hasText: "Spanish" })).not.toBeVisible();
  });

  test("should inspect modal validation and trigger successful update", async ({ page }) => {
    const englishRow = page.locator("tr", { hasText: "English" });
    await englishRow.locator('button[title="Edit language"]').click();

    await expect(page.locator(".modal-title")).toHaveText("Edit a Language");
    const nameInput = page.locator('.modal input[placeholder="Language name"]');
    await expect(nameInput).toHaveValue("English");

    await nameInput.clear();
    await page.locator(".modal-footer").getByRole("button", { name: "Edit language" }).click();
    await expect(page.getByText("Language name is required")).toBeVisible();

    await nameInput.fill("English Edited");

    await page.route("**/v1/admin/languages/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { ...mockLanguages[0], name: "English Edited" } })
      });
    });

    await page.locator(".modal-footer").getByRole("button", { name: "Edit language" }).click();
    await expect(page.locator(".modal-title")).not.toBeVisible();
  });
});