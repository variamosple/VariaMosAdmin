import { expect, type Page, test } from "@playwright/test";
import dbHelper from "../helpers/adminDbHelper.js";
import { totp } from "../helpers/totp";

// An administrator turns off a lost second factor (SPC-2026-10-17-001, lot 4)

/** The home page, at the address the server gives (with or without hash). */
const HOME = /^http:\/\/localhost:3000\/variamos_admin\/(#\/?)?$/;

test.describe("Two-factor reset by an administrator - Real E2E", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const userEmail = `user-test-${suffix}@variamos-test.com`;
  const password = "Password123!";

  test.beforeAll(async () => {
    await dbHelper.seedTestUsers(suffix);
  });

  // A fresh page each time: the session library keeps the previous
  // session in memory until the page is loaded again
  const signIn = async (page: Page, email: string) => {
    await page.context().clearCookies();
    await page.goto("http://localhost:3000/variamos_admin/#/login");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
  };

  test("turns off the factor of a user who lost it", async ({ page }) => {
    test.setTimeout(90_000);

    // The user turns the factor on
    await signIn(page, userEmail);
    await expect(page).toHaveURL(HOME);
    await page.goto("http://localhost:3000/variamos_admin/#/my-account");
    await page.getByRole("button", { name: "Turn on" }).click();
    await page.getByLabel("Confirm your password").fill(password);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByTestId("mfa-secret")).toBeVisible();
    const secret = (await page.getByTestId("mfa-secret").textContent()) ?? "";
    await page.getByLabel("Code from the app").fill(totp(secret));
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Turn on" })
      .click();
    await page.getByRole("button", { name: "I have saved them" }).click();
    await expect(page.getByText("On", { exact: true })).toBeVisible();

    // The administrator finds the user and turns the factor off
    await signIn(page, adminEmail);
    await expect(page).toHaveURL(HOME);
    await page.getByText("Users", { exact: true }).click();
    await expect(page).toHaveURL(/.*\/users/);
    const searchPromise = page.waitForResponse(
      (response) =>
        response.url().includes("v1/users") && response.url().includes(suffix),
    );
    await page.locator('input[id="search"]').fill(userEmail);
    await searchPromise;
    await page
      .locator("table tbody tr", { hasText: userEmail })
      .locator('button[title="See user details"]')
      .click();

    const section = page.getByRole("region", {
      name: "Two-factor authentication",
    });
    await expect(section.getByText("On", { exact: true })).toBeVisible();
    await section
      .getByRole("button", { name: "Turn off two-factor authentication" })
      .click();
    await page
      .locator(".modal-content")
      .getByRole("button", { name: "Turn off" })
      .click();
    await expect(
      section.getByText("This user has not turned it on."),
    ).toBeVisible();

    // The password alone opens the session again
    await signIn(page, userEmail);
    await expect(page).toHaveURL(HOME);
    await expect(
      page.getByText(/Welcome to the VariaMos admin module/),
    ).toBeVisible();
  });
});
