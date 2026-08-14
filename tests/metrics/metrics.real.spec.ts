import { test, expect } from "@playwright/test";
import { login } from "../helpers/commands.js";
import dbHelper from "../helpers/adminDbHelper.js";

test.describe("Metrics & Monitoring - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
    await dbHelper.seedTestVisits(suffix);
  });

  test("should retrieve and display real metric charts on the dashboard", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/");

    await page.getByRole("button", { name: "Metrics" }).first().click();
    await expect(page).toHaveURL(/.*metrics.*/);

    await expect(page.locator("h1").first()).toHaveText("Metrics");

    await expect(page.getByText("Daily Unique Visits")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Daily Visits")).toBeVisible();
    await expect(page.getByText("Monthly Visits")).toBeVisible();
    await expect(page.getByText("Top visited pages (Last 3 Months)")).toBeVisible();
    await expect(page.getByText("Yearly visits")).toBeVisible();
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestVisits(suffix);
    await dbHelper.cleanTestUsers(suffix);
  });
});