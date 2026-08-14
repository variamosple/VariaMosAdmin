import { test, expect } from "@playwright/test";

test.describe("User Management - Mocked Flows", () => {
  const mockUsers = [
    { id: "u1", user: "john_doe", name: "John Doe", email: "john@example.com", isEnabled: true, isDeleted: false, createdAt: "2026-07-20T10:00:00Z", lastLogin: "2026-07-23T15:00:00Z" },
    { id: "u2", user: "jane_smith", name: "Jane Smith", email: "jane@example.com", isEnabled: false, isDeleted: false, createdAt: "2026-07-21T11:00:00Z", lastLogin: null }
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
              permissions: ["users::query", "users::update"]
            }
          }
        })
      });
    });

    await page.route("**/v1/users*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mockUsers, totalItems: 2, totalPages: 1, currentPage: 1 })
      });
    });

    await page.goto("http://localhost:3000/#/users");
  });

  test("should display the user list, handle search input and pagination controls", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Users list");
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th", { hasText: "user" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Name" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Email" })).toBeVisible();

    await expect(page.locator("td", { hasText: "john_doe" })).toBeVisible();
    await expect(page.locator("td", { hasText: "jane_smith" })).toBeVisible();

    await page.route("**/v1/users?*search=john*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [mockUsers[0]], totalItems: 1, totalPages: 1, currentPage: 1 })
      });
    });

    await page.locator('input[id="search"]').fill("john");
    await expect(page.locator("td", { hasText: "john_doe" })).toBeVisible();
    await expect(page.locator("td", { hasText: "jane_smith" })).not.toBeVisible();
  });

  test("should inspect user details, layout fields, and toggle active/disabled states", async ({ page }) => {
    await page.route("**/v1/users/u1", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: mockUsers[0] }) });
    });
    await page.route("**/v1/users/u1/roles*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [], totalItems: 0, totalPages: 1, currentPage: 1 }) });
    });
    await page.route("**/v1/roles*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
    });

    const johnRow = page.locator("tr", { hasText: "john_doe" });
    await johnRow.locator('button[title="See user details"]').click();

    await expect(page.locator("h1")).toHaveText("User information");
    await expect(page.getByText("User Id:").locator("..")).toContainText("u1");
    await expect(page.getByText("Name:").locator("..")).toContainText("John Doe");

    await page.getByRole("button", { name: "Back To User List" }).click();
    await expect(page).toHaveURL(/.*\/users/);

    // Disable john
    await page.route("**/v1/users/u1/disable", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
    await johnRow.locator('button[title="Disable user"]').click();
    await page.getByRole("button", { name: "Accept" }).click();

    // Enable jane
    await page.route("**/v1/users/u2/enable", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
    const janeRow = page.locator("tr", { hasText: "jane_smith" });
    await janeRow.locator('button[title="Enable user"]').click();
    await page.getByRole("button", { name: "Accept" }).click();
  });
});