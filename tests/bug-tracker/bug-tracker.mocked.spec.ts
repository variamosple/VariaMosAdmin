import { test, expect } from "@playwright/test";

test.describe("Admin - Bug Tracker E2E Flows", () => {
  const adminEmail = "admin@variamos-test.com";
  const adminPassword = "Password123!";

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.route("**/auth/sign-in", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            user: {
              id: "1",
              user: "admin_test",
              name: "Admin Test",
              email: "admin@variamos-test.com",
              roles: ["Admin"],
              permissions: ["bugs::query", "users::query", "admin::languages::query", "admin::projects::query", "admin::models::query"]
            },
            authToken: "fake-jwt-token"
          }
        })
      });
    });

    await page.route("**/auth/session-info", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            user: {
              id: "1",
              user: "admin_test",
              name: "Admin Test",
              email: "admin@variamos-test.com",
              roles: ["Admin"],
              permissions: ["bugs::query", "users::query", "admin::languages::query", "admin::projects::query", "admin::models::query"]
            }
          }
        })
      });
    });

    await page.route("**/v1/configurations/menu", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          transactionId: "getMenu",
          data: {
            items: [
              { title: "Home", type: "location", location: "https://app.variamos.com/" },
              {
                title: "Admin",
                type: "location",
                location: "https://app.variamos.com/variamos_admin/",
                allowedPermissions: ["users::query", "roles::query", "permissions::query", "metrics::query", "micro-services::query", "bugs::query"]
              }
            ],
            subMenu: [
              {
                accessibleFrom: "/variamos_admin/",
                items: [
                  { title: "Users", location: "/users", allowedPermissions: ["users::query"] },
                  { title: "Roles", location: "/roles", allowedPermissions: ["roles::query"] },
                  { title: "Permission", location: "/permissions", allowedPermissions: ["permissions::query"] },
                  { title: "Languages", location: "/languages", allowedPermissions: ["admin::languages::query"] },
                  { title: "Projects", location: "/projects", allowedPermissions: ["admin::projects::query"] },
                  { title: "Models", location: "/models", allowedPermissions: ["admin::models::query"] },
                  { title: "Metrics", location: "/metrics", allowedPermissions: ["metrics::query"] },
                  { title: "Monitoring", location: "/monitoring", allowedPermissions: ["micro-services::query"] },
                  { title: "Bugs", location: "/bugs", allowedPermissions: ["bugs::query"] }
                ]
              }
            ],
            options: [
              {
                title: "Report a problem",
                location: "#report-bug",
                accessibleFrom: "/variamos_admin/",
                target: "self",
                allowedPermissions: [],
              }
            ]
          }
        })
      });
    });

    await page.route("**/bugs/repos", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transactionId: "queryBugRepos", data: ["VariaMos/VariaMosAdmin", "VariaMos/VariaMosPLE"] })
      });
    });

    await page.route("**/bugs/categories", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transactionId: "queryCategories", data: ["Editor", "Backend", "UI", "Other"] })
      });
    });
  });

  const loginAndGoToBugs = async (page) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("authToken", "fake-jwt-token");
    });
    await page.goto("http://localhost:3000");

    const emailLocator = page.locator("#email");
    if (await emailLocator.isVisible()) {
      await emailLocator.fill(adminEmail);
      await page.locator("#password").fill(adminPassword);
      await page.locator('button[type="submit"]').click();
    }

    const modal = page.locator(".modal");
    if (await modal.isVisible()) {
      await modal.getByRole("button", { name: "Cancel" }).click();
    }

    await page.getByText("Bugs", { exact: true }).click();
  };

  test("should log in as admin and navigate to the Bug Tracker dashboard", async ({ page }) => {
    await page.route("**/bugs*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transactionId: "queryBugs", data: [] })
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem("authToken", "fake-jwt-token");
    });
    await page.goto("http://localhost:3000");

    const emailLocator = page.locator("#email");
    if (await emailLocator.isVisible()) {
      await emailLocator.fill(adminEmail);
      await page.locator("#password").fill(adminPassword);
      await page.locator('button[type="submit"]').click();
    }

    await expect(page).toHaveURL("http://localhost:3000/");

    const modal = page.locator(".modal");
    if (await modal.isVisible()) {
      await modal.getByRole("button", { name: "Cancel" }).click();
    }

    await page.getByText("Bugs", { exact: true }).click();
    await expect(page).toHaveURL(/.*\/bugs/);
    await expect(page.locator("h1")).toHaveText("Bugs list");
  });

  test("should display GitHub bugs and update list when filters are applied", async ({ page }) => {
    const mockIssues = [
      { id: "gh-1", title: "GitHub UI Crash", priority: "high", status: "open", category: "Editor", description: "Crashes on click", attachments: [] },
      { id: "gh-2", title: "GitHub Performance lag", priority: "low", status: "closed", category: "Backend", description: "Laggy scrolling", attachments: [] }
    ];

    await page.route("**/bugs*", async (route) => {
      if (route.request().url().includes("search=Performance")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ transactionId: "queryBugsFiltered", data: [mockIssues[1]] })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ transactionId: "queryBugs", data: mockIssues })
        });
      }
    });

    await loginAndGoToBugs(page);

    await expect(page.locator(".nav-tabs .nav-link.active")).toContainText("GitHub Bugs");

    const rows = page.locator(".tab-pane.active table tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("GitHub UI Crash");
    await expect(rows.nth(1)).toContainText("GitHub Performance lag");

    await page.locator('input[name="search"]').fill("Performance");
    await expect(rows).toHaveCount(1);
    await expect(rows.nth(0)).toContainText("GitHub Performance lag");
    await expect(rows.nth(0)).not.toContainText("GitHub UI Crash");
  });

  test("should display Local Inbox bugs, access attachments, and perform Approve/Reject actions", async ({ page }) => {
    const mockLocalBugs = [
      { id: "local-1", title: "Local UI Crash", priority: "medium", status: "pending", category: "Editor", description: "Crash log", reporterEmail: "reporter@test.com", attachments: [{ filePath: "/uploads/screenshot.png" }] }
    ];

    await page.route("**/bugs/local*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transactionId: "queryLocalBugs", data: mockLocalBugs })
      });
    });

    await page.route("**/bugs/local-1/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transactionId: "updateStatus", data: { id: "local-1", status: "open" } })
      });
    });

    await page.route("**/bugs/local-1/reject", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transactionId: "rejectBug", data: { id: "local-1", status: "rejected" } })
      });
    });

    await loginAndGoToBugs(page);

    await page.getByText("Local Inbox").click();

    await expect(page.getByRole("button", { name: "Sync GitHub" })).not.toBeVisible();

    const row = page.locator(".tab-pane.active table tbody tr").first();
    await expect(row.locator("a")).toHaveAttribute("href", /.*\/uploads\/screenshot.png/);
    await expect(row.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(row.getByRole("button", { name: "Reject" })).toBeVisible();

    await row.getByRole("button", { name: "Approve" }).click();
    await page.locator('.modal select[name="githubRepo"]').selectOption("VariaMos/VariaMosPLE");
    await page.locator(".modal-footer").getByRole("button", { name: "Approve & Send to GitHub" }).click();

    await row.getByRole("button", { name: "Reject" }).click();
  });

  test("should display Trash Bin bugs and perform Restore action", async ({ page }) => {
    const mockRejectedBugs = [
      { id: "local-2", title: "Duplicate issue", priority: "low", status: "rejected", category: "Editor", description: "Dup", reporterEmail: "another@test.com", attachments: [] }
    ];

    await page.route("**/bugs/local*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transactionId: "queryLocalRejected", data: mockRejectedBugs })
      });
    });

    await page.route("**/bugs/local-2/restore", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transactionId: "restoreBug", data: { id: "local-2", status: "pending" } })
      });
    });

    await loginAndGoToBugs(page);
    await page.getByText("Trash Bin").click();

    const row = page.locator(".tab-pane.active table tbody tr").first();
    await expect(row.getByRole("button", { name: "Restore" })).toBeVisible();
    await expect(row.getByRole("button", { name: "Approve" })).not.toBeVisible();

    await row.getByRole("button", { name: "Restore" }).click();
  });

  test("should handle User Mode Modal (UserBugFormModal) visibility, validation, and submission", async ({ page }) => {
    await page.route("**/bugs*", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            transactionId: "createBug",
            data: { id: "user-bug-123", title: "User Bug Title", description: "User Bug Description", priority: "medium", category: "Editor", githubRepo: "" }
          })
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) });
      }
    });

    await loginAndGoToBugs(page);

    await page.getByRole("button", { name: "Report a Bug" }).click();
    await expect(page.locator(".modal-title")).toHaveText("Report a New Bug");

    await page.locator(".modal-footer").getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator(".modal-title")).not.toBeVisible();

    await page.getByRole("button", { name: "Report a Bug" }).click();
    await expect(page.locator('.modal select[name="priority"]')).not.toBeVisible();

    await page.locator(".modal-footer").getByRole("button", { name: "Report Bug" }).click();
    await expect(page.getByText("Title is required")).toBeVisible();
    await expect(page.getByText("Description is required")).toBeVisible();

    await page.locator('.modal input[name="title"]').fill("User Bug Title");
    await page.locator('.modal textarea[name="description"]').fill("User Bug Description");
    await page.locator('.modal select[name="category"]').selectOption("Editor");

    await page.locator(".modal-footer").getByRole("button", { name: "Report Bug" }).click();
    await expect(page.locator(".modal-title")).not.toBeVisible();
  });

  test("should open bug report modal when clicking Report a problem in menu options", async ({ page }) => {
    await page.route("**/bugs*", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            transactionId: "createBug",
            data: { id: "user-bug-999", title: "Global Bug", description: "Global bug description", priority: "medium", category: "Editor", githubRepo: "" }
          })
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) });
      }
    });

    await page.addInitScript(() => {
      window.localStorage.setItem("authToken", "fake-jwt-token");
    });
    await page.goto("http://localhost:3000");

    const emailLocator = page.locator("#email");
    if (await emailLocator.isVisible()) {
      await emailLocator.fill(adminEmail);
      await page.locator("#password").fill(adminPassword);
      await page.locator('button[type="submit"]').click();
    }

    const modal = page.locator(".modal");
    if (await modal.isVisible()) {
      await modal.getByRole("button", { name: "Cancel" }).click();
    }

    const dropdownToggle = page.locator("#nav-dropdown");
    await expect(dropdownToggle).toBeVisible();
    await dropdownToggle.click();

    await page.getByText("Report a problem").click();
    await expect(page.locator(".modal-title")).toHaveText("Report a New Bug");

    await page.locator('#bugTitle').fill("Global Bug");
    await page.locator('#bugDescription').fill("Global bug description");
    await page.locator('#bugCategory').selectOption("Editor");

    await page.locator(".modal-footer").getByRole("button", { name: "Report Bug" }).click();
    await expect(page.locator(".modal-title")).not.toBeVisible();
  });
});