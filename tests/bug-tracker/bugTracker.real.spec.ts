import { test, expect } from "@playwright/test";
import dbHelper from "../helpers/adminDbHelper.js";
import { login } from "../helpers/commands";

test.describe("Bug Tracker - Real DB E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
  });

  test("should persist a new bug in the database and support commenting in the details view", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/#/");

    const bugsPromise = page.waitForResponse("**/bugs*");
    await page.getByText("Bugs", { exact: true }).click();
    await expect(page).toHaveURL(/.*bugs.*/);
    await bugsPromise;

    await page.getByRole("button", { name: "Report a Bug" }).click();
    await expect(page.locator(".modal-title")).toHaveText("Report a New Bug");

    const bugTitle = "Real Database Bug Test " + Date.now();
    await page.locator('.modal input[name="title"]').fill(bugTitle);
    await page.locator('.modal textarea[name="description"]').fill("This bug was created in a real integration test.");
    await page.locator('.modal select[name="category"]').selectOption("Editor");

    const reportPromise = page.waitForResponse("**/bugs");
    await page.locator(".modal-footer").getByRole("button", { name: "Report Bug" }).click();
    await reportPromise;
    await expect(page.locator(".modal-title")).not.toBeVisible();

    await page.getByText("Local Inbox").click();
    const row = page.locator(".tab-pane.active tr", { hasText: bugTitle });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: "Details" }).click();
    await expect(page.locator("h5", { hasText: "Comments & Audit Logs" })).toBeVisible();
    await expect(page.getByText("No comments or logs recorded yet.")).toBeVisible();

    const testComment = "Verification comment for database persistence " + Date.now();
    await page.locator('textarea[placeholder="Write a comment..."]').fill(testComment);
    
    const commentPromise = page.waitForResponse("**/bugs/*/notes");
    await page.getByRole("button", { name: "Add Comment" }).click();
    await commentPromise;

    await expect(page.getByText(testComment)).toBeVisible();

    await page.locator(".modal-footer").getByRole("button", { name: "Close" }).click();

    // Reopen details and verify persistence
    await row.getByRole("button", { name: "Details" }).click();
    await expect(page.getByText(testComment)).toBeVisible();

    await page.locator(".modal-footer").getByRole("button", { name: "Close" }).click();
  });

  test("should open bug report modal when clicking Report a problem in options menu and persist it", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/#/");

    // Wait for configurations/menu to load
    await page.waitForResponse("**/v1/configurations/menu");

    const dropdownToggle = page.locator("#nav-dropdown");
    await expect(dropdownToggle).toBeVisible();
    await dropdownToggle.click();

    await page.getByText("Report a problem").click();
    await expect(page.locator(".modal-title")).toHaveText("Report a New Bug");

    const bugTitle = "Real Global Bug Test " + Date.now();
    await page.locator('#bugTitle').fill(bugTitle);
    await page.locator('#bugDescription').fill("This global bug was created via the menu options link.");
    await page.locator('#bugCategory').selectOption("Editor");

    const reportPromise = page.waitForResponse("**/bugs");
    await page.locator(".modal-footer").getByRole("button", { name: "Report Bug" }).click();
    await reportPromise;
    await expect(page.locator(".modal-title")).not.toBeVisible();

    // Verify it is visible in the Local Inbox
    await page.getByText("Bugs", { exact: true }).click();
    await page.getByText("Local Inbox").click();
    const row = page.locator(".tab-pane.active tr", { hasText: bugTitle });
    await expect(row).toBeVisible();
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestUsers(suffix);
  });
});