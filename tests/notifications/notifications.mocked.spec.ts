import { test, expect } from "@playwright/test";

test.describe("Notifications Admin - Mocked E2E Flows", () => {
  const mockUsers = [
    { id: "user-1", name: "Alice Smith", email: "alice@example.com", isEnabled: true, isDeleted: false },
    { id: "user-2", name: "Bob Jones", email: "bob@example.com", isEnabled: true, isDeleted: false },
  ];

  const mockRoles = [
    { id: 1, name: "Administrator" },
    { id: 2, name: "Reviewer" },
  ];

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    // Mock session info
    await page.route("**/auth/session-info", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            user: {
              id: "admin-1",
              user: "admin",
              name: "Admin User",
              email: "admin@example.com",
              roles: ["Admin"],
              permissions: ["admin::notifications::dispatch"],
            },
          },
        }),
      });
    });

    // Mock query users
    await page.route("**/v1/users*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockUsers,
        }),
      });
    });

    // Mock query roles
    await page.route("**/v1/roles*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockRoles,
        }),
      });
    });
  });

  test("should load form, filter specific users, and dispatch broadcast successfully", async ({ page }) => {
    await page.goto("http://localhost:3000/variamos_admin/#/admin/notifications");

    await expect(page.locator("h4")).toContainText("Manual Notifications Dashboard");

    // Test form validation: submit without title/body
    await page.click('button[type="submit"]');
    await expect(page.locator(".alert-danger")).toContainText("Please provide both title and message body.");

    // Fill title & body
    await page.fill('input[placeholder="e.g., Scheduled Maintenance Alert"]', "Service Maintenance");
    await page.fill('textarea[placeholder="Enter the notification message here..."]', "The system will be down for 2 hours.");

    // Select specific users audience
    await page.click("text=Specific Users");

    // Search and select Alice
    const searchInput = page.locator('input[placeholder="Search user by name or email..."]');
    await searchInput.fill("Alice");
    await page.click("text=Alice Smith (alice@example.com)");

    // Verify tag is added
    await expect(page.locator(".badge")).toContainText("Alice Smith");

    // Mock successful dispatch
    await page.route("**/v1/admin/notifications/dispatch", async (route) => {
      expect(route.request().method()).toBe("POST");
      const postData = JSON.parse(route.request().postData() || "{}");
      expect(postData.audience).toBe("users");
      expect(postData.userIds).toContain("user-1");
      expect(postData.title).toBe("Service Maintenance");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          errorCode: 0,
          message: "Notification dispatched successfully.",
        }),
      });
    });

    // Dispatch
    await page.click('button[type="submit"]');

    // Success alert should show up
    await expect(page.locator(".alert-success")).toContainText("Notifications dispatched successfully!");
  });
});
