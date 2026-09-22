import { expect, test } from "@playwright/test";

test.describe("Microservices - Complete Mocked E2E Workflow", () => {
  const mockMicroservices = [
    {
      id: "ms-admin",
      serviceName: "variamos_ms_admin",
      displayName: "Administration Service",
      state: "running",
      health: {
        status: "UP",
        responseTimeMs: 28,
        checkedAt: "2026-09-21T00:00:00Z",
      },
      uptimeSummary: {
        uptime30dPercentage: 99.8,
        history: [{ date: "2026-09-20", status: "UP" }],
      },
      targetUrl: "http://localhost:4000",
      replicasCount: 1,
    },
    {
      id: "ms-languages",
      serviceName: "variamos_ms_languages",
      displayName: "Languages Service",
      state: "exited",
      health: {
        status: "DOWN",
        responseTimeMs: 0,
        checkedAt: "2026-09-21T00:00:00Z",
      },
      uptimeSummary: {
        uptime30dPercentage: 94.5,
        history: [{ date: "2026-09-20", status: "DOWN" }],
      },
      targetUrl: "http://localhost:3000",
      replicasCount: 0,
    },
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
              id: "admin1",
              user: "admin",
              name: "Admin User",
              email: "admin@example.com",
              roles: ["Admin"],
              permissions: ["micro-services::query", "micro-services::manage"],
            },
          },
        }),
      });
    });
  });

  test("should load dashboard, display metrics/uptime, trigger refresh, configure params, and manage container lifecycle", async ({
    page,
  }) => {
    // Mock microservices list query
    await page.route("**/v1/micro-services?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockMicroservices,
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
        }),
      });
    });

    // Mock configurations subpath
    await page.route(
      "**/v1/micro-services/variamos_ms_admin/configurations*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: 1,
                serviceName: "variamos_ms_admin",
                key: "PORT",
                value: "4000",
                type: "string",
                isSecret: false,
                isReadOnly: false,
                description: "Port number",
              },
            ],
          }),
        });
      },
    );

    // Mock audit logs subpath
    await page.route(
      "**/v1/micro-services/variamos_ms_admin/audit-logs*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [] }),
        });
      },
    );

    // Mock check subpath
    let checkTriggered = false;
    await page.route("**/v1/micro-services/check*", async (route) => {
      checkTriggered = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              serviceName: "variamos_ms_admin",
              status: "UP",
              responseTimeMs: 25,
            },
          ],
        }),
      });
    });

    // Mock stop subpath
    await page.route(
      "**/v1/micro-services/variamos_ms_admin/stop*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      },
    );

    // Mock start subpath
    await page.route(
      "**/v1/micro-services/variamos_ms_languages/start*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      },
    );

    // 2. Set auth token and navigate
    await page.addInitScript(() => {
      window.localStorage.setItem("authToken", "fake-jwt-token");
    });
    await page.goto("http://localhost:3000/#/monitoring");

    // Verify main page title
    await expect(page.locator("h1")).toHaveText(
      "Microservices & System Status",
    );

    // 3. Verify Table Rows and Data
    const adminRow = page.locator("tr", { hasText: "Administration Service" });
    await expect(adminRow.locator("td").nth(1)).toContainText("UP");
    await expect(adminRow.locator("td").nth(2)).toContainText("28 ms");
    await expect(adminRow.locator("td").nth(3)).toContainText("99.8%");
    await expect(
      adminRow.locator('button[title="Restart Service"]'),
    ).toBeVisible();
    await expect(
      adminRow.locator('button[title="Stop Service"]'),
    ).toBeVisible();

    const langRow = page.locator("tr", { hasText: "Languages Service" });
    await expect(langRow.locator("td").nth(1)).toContainText("DOWN");
    await expect(langRow.locator("td").nth(3)).toContainText("94.5%");
    await expect(
      langRow.locator('button[title="Start Service"]'),
    ).toBeVisible();

    // 4. Test Manual Health Check Trigger ("Refresh" button)
    const refreshButton = page.getByRole("button", { name: "Refresh" });
    await expect(refreshButton).toBeVisible();
    const checkResponsePromise = page.waitForResponse((res) =>
      res.url().includes("/v1/micro-services/check"),
    );
    await refreshButton.click();
    await checkResponsePromise;
    expect(checkTriggered).toBeTruthy();

    // 5. Test Page Refresh Select Option and turn Off to avoid unmounting rows during test
    const refreshSelect = page.getByLabel("Page auto-refresh interval");
    await expect(refreshSelect).toBeVisible();
    await refreshSelect.selectOption("0");
    await expect(refreshSelect).toHaveValue("0");

    // 6. Test Service Configuration Modal
    const configBtn = adminRow.locator(
      'button[title="Configure service parameters"]',
    );
    await configBtn.click();
    const modalTitle = page.getByText(
      "Settings & Audit - Administration Service",
    );
    await expect(modalTitle).toBeVisible();
    await expect(page.getByRole("cell", { name: "PORT" })).toBeVisible();

    // Close modal via modal footer Close button
    await page.getByTestId("config-modal-close-btn").click();
    await expect(modalTitle).not.toBeVisible();

    // Ensure we are still on the monitoring page
    await expect(page).toHaveURL(/.*#\/monitoring.*/);

    // 7. Test Stop Container Confirmation Flow
    const updatedAdminRow = page.locator("tr", {
      hasText: "Administration Service",
    });
    await updatedAdminRow.locator('button[title="Stop Service"]').click();
    await expect(
      page.getByText("Are you sure you want to stop Administration Service?"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Accept" }).click();

    // 8. Test Start Container Confirmation Flow
    await langRow.locator('button[title="Start Service"]').click();
    await expect(
      page.getByText("Are you sure you want to start Languages Service?"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Accept" }).click();
  });
});