import { test, expect } from "@playwright/test";

test.describe("Metrics - Mocked E2E Flows", () => {
  const mockMetrics = [
    {
      id: "m1",
      title: "User Logins Over Time",
      chartType: "line",
      defaultFilter: "30days",
      filters: ["7days", "30days", "90days"],
      labelKey: "date",
      data: [["date", "value"], ["2026-07-20", 15], ["2026-07-21", 25], ["2026-07-22", 40]]
    },
    {
      id: "m2",
      title: "Users by Role Distribution",
      chartType: "pie",
      defaultFilter: "all",
      filters: [],
      labelKey: "role",
      data: [["role", "value"], ["Admin", 2], ["User", 45]]
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
              permissions: ["metrics::query"]
            }
          }
        })
      });
    });
  });

  test("should render charts and date filters on the Metrics dashboard", async ({ page }) => {
    await page.route("**/v1/metrics", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mockMetrics })
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem("authToken", "fake-jwt-token");
    });
    await page.goto("http://localhost:3000/#/metrics");

    await expect(page.locator("h1").first()).toHaveText("Metrics");
    await expect(page.locator("h2", { hasText: "User Logins Over Time" })).toBeVisible();
    await expect(page.locator("h2", { hasText: "Users by Role Distribution" })).toBeVisible();

    await page.route("**/v1/metrics/m1*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { ...mockMetrics[0], data: [["date", "value"], ["2026-07-01", 5]] }
        })
      });
    });

    const loginsSection = page.locator("h2", { hasText: "User Logins Over Time" }).locator("..");
    await loginsSection.locator("button").click();

    await page.locator('input[name="fromDate"]').fill("2026-07-01");
    await page.locator('input[name="toDate"]').fill("2026-07-15");

    const filterPromise = page.waitForResponse("**/v1/metrics/m1*");
    await page.getByRole("button", { name: "Apply" }).click();
    await filterPromise;
  });
});