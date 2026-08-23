import { test, expect } from "@playwright/test";

test.describe("Global Configurations - Mocked E2E Flows", () => {
  const mockConfigurations = [
    {
      id: 1,
      key: "general.site_name",
      value: "VariaMos",
      type: "string",
      category: "general",
      requiresMfa: false,
      isSecret: false,
      environmentScope: "all",
      isReadOnly: false,
      targetServices: ["all"],
      description: "Platform name displayed on the user interface.",
    },
    {
      id: 2,
      key: "security.password.min_length",
      value: 12,
      type: "number",
      category: "security",
      requiresMfa: true,
      isSecret: false,
      environmentScope: "all",
      isReadOnly: false,
      targetServices: ["variamos_ms_security"],
      description: "Minimum length required for user passwords.",
    },
  ];

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    // Mock Session Info with proper permissions
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
              permissions: ["configurations::query", "configurations::update"],
            },
          },
        }),
      });
    });

    // Mock configurations query
    await page.route("**/v1/configurations", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockConfigurations,
          totalCount: 2,
        }),
      });
    });

    await page.goto("http://localhost:3000/#/configurations");
  });

  test("should display configurations list grouped under correct tabs", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Global Configurations");
    await expect(page.locator("table").first()).toBeVisible();

    // Check General tab row
    const siteNameRow = page.locator("tr", { hasText: "general.site_name" });
    await expect(siteNameRow.locator("td").first()).toContainText("Platform name displayed on the user interface.");
    await expect(siteNameRow.locator("td").nth(1)).toContainText("VariaMos");

    // Click on Security & Passwords Tab
    await page.click('button:has-text("Security & Passwords")');

    const passwordRow = page.locator("tr", { hasText: "security.password.min_length" });
    await expect(passwordRow.locator("td").first()).toContainText("MFA PROTECTED");
    await expect(passwordRow.locator("td").nth(1)).toContainText("12");
  });

  test("should toggle boolean configurations directly (Sandbox mode)", async ({ page }) => {
    // Add a boolean config to mock list temporarily
    await page.route("**/v1/configurations", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            ...mockConfigurations,
            {
              id: 3,
              key: "security.password.require_special",
              value: true,
              type: "boolean",
              category: "security",
              requiresMfa: false,
              isSecret: false,
              environmentScope: "all",
              isReadOnly: false,
              targetServices: ["variamos_ms_security"],
            },
          ],
          totalCount: 3,
        }),
      });
    });

    await page.reload();
    await page.click('button:has-text("Security & Passwords")');

    const toggle = page.locator('input[type="checkbox"][id*="security.password.require_special"]');
    await expect(toggle).toBeChecked();

    // Toggle off locally
    await toggle.click();

    // Alert banner for unsaved changes should be visible
    await expect(page.locator(".alert-warning")).toBeVisible();
    await expect(page.locator(".alert-warning")).toContainText("You have unsaved changes.");

    // Discard changes
    await page.click('button:has-text("Discard")');
    await expect(page.locator(".alert-warning")).not.toBeVisible();
    await expect(toggle).toBeChecked();
  });

  test("should open modal, edit config, and submit to trigger save workflow", async ({ page }) => {
    // Edit site_name config which uses the Form Modal
    const siteNameRow = page.locator("tr", { hasText: "general.site_name" });
    await siteNameRow.locator('button[title="Edit setting"]').click();

    // Verify modal elements
    await expect(page.locator(".modal-title")).toHaveText("Edit Configuration");
    const input = page.locator('.modal-body input[type="text"]');
    await input.fill("VariaMos Custom");

    await page.click('button[type="submit"]');

    // Modal closes and sandbox alert appears
    await expect(page.locator(".modal-title")).not.toBeVisible();
    await expect(page.locator(".alert-warning")).toBeVisible();

    // Mock successful update response
    await page.route("**/v1/configurations/general.site_name", async (route) => {
      expect(route.request().method()).toBe("PUT");
      expect(route.request().postDataJSON().value).toBe("VariaMos Custom");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            key: "general.site_name",
            value: "VariaMos Custom",
          },
        }),
      });
    });

    // Save changes globally
    await page.click('button:has-text("Save Changes")');

    // Success toast should appear
    await expect(page.locator(".toast")).toBeVisible();
    await expect(page.locator(".toast")).toContainText("Successfully saved 1 configuration(s).");
  });
});
