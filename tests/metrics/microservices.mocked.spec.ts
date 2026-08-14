import { test, expect } from "@playwright/test";

test.describe("Microservices - Mocked E2E Flows", () => {
  const mockMicroservices = [
    { id: "ms-admin", names: ["ms-admin-api"], state: "running", status: "Up 2 hours", created: "2026-07-24T10:00:00Z" },
    { id: "ms-languages", names: ["ms-languages-api"], state: "exited", status: "Exited (1) 1 hour ago", created: "2026-07-24T10:00:00Z" }
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
              permissions: ["micro-services::query"]
            }
          }
        })
      });
    });
  });

  test("should monitor microservices, check statuses, and trigger control workflows", async ({ page }) => {
    await page.route("**/v1/micro-services*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mockMicroservices, totalItems: 2, totalPages: 1, currentPage: 1 })
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem("authToken", "fake-jwt-token");
    });
    await page.goto("http://localhost:3000/#/monitoring");

    await expect(page.locator("h1")).toHaveText("Monitoring - Microservices list");

    const adminRow = page.locator("tr", { hasText: "ms-admin" });
    await expect(adminRow.locator("td").nth(2)).toHaveText("running");
    await expect(adminRow.locator("td").nth(3)).toHaveText("Up 2 hours");
    await expect(adminRow.locator('button[title="Stop Microservice"]')).toBeVisible();
    await expect(adminRow.locator('button[title="Restart Microservice"]')).toBeVisible();

    const langRow = page.locator("tr", { hasText: "ms-languages" });
    await expect(langRow.locator("td").nth(2)).toHaveText("exited");
    await expect(langRow.locator('button[title="Start Microservice"]')).toBeVisible();

    await page.route("**/v1/micro-services/ms-admin/stop", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    await adminRow.locator('button[title="Stop Microservice"]').click();
    await expect(page.getByText("Are you sure you want to stop the microservice?")).toBeVisible();
    await page.getByRole("button", { name: "Accept" }).click();

    await page.route("**/v1/micro-services/ms-languages/start", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    await langRow.locator('button[title="Start Microservice"]').click();
    await expect(page.getByText("Are you sure you want to start the microservice?")).toBeVisible();
    await page.getByRole("button", { name: "Accept" }).click();
  });
});