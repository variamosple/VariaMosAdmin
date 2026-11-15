import { expect, test } from "@playwright/test";
import dbHelper from "../helpers/adminDbHelper.js";
import { login } from "../helpers/commands.js";

test.describe("Metrics & Monitoring - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).slice(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
    await dbHelper.seedTestVisits(suffix);
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestVisits(suffix);
    await dbHelper.cleanTestUsers(suffix);
  });

  test("should retrieve and display real metric charts on the dashboard", async ({
    page,
  }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("http://localhost:3000/variamos_admin/");

    await page.getByRole("button", { name: "Metrics" }).first().click();
    await expect(page).toHaveURL(/.*metrics.*/);

    await expect(page.locator("h1").first()).toHaveText("Metrics");

    // Key figures, then every chart, for the last 30 days (EV-90)
    await expect(page.getByText("Over the period")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByTestId("figure-visits")).toBeVisible();
    await expect(page.getByText("On the platform today")).toBeVisible();
    for (const title of [
      "Visits and visitors",
      "Active users and projects",
      "Most visited pages",
      "Sign-ins",
      "New accounts",
      "Models by type",
    ]) {
      // Exact: "Sign-ins" is also the start of the grid's title
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
    }
    // The sign-ins grid, its title naming the reader's time zone
    await expect(
      page.getByRole("heading", { name: /^Sign-ins by day and hour \(.+\)$/ }),
    ).toBeVisible();
    await expect(page.getByText(/Yearly visits/)).toBeVisible();

    // A ready-made period reads the whole page again
    const reread = page.waitForResponse(/\/v1\/metrics\?startDate=/);
    await page.getByRole("button", { name: "12 months" }).click();
    expect((await reread).status()).toBe(200);
  });
});
