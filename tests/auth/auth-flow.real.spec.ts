import { test, expect } from "@playwright/test";
import dbHelper from "../helpers/adminDbHelper.js";

test.describe("Auth - Real E2E Flows", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
  });

  test("should log in with seeded admin credentials, verify local storage, update country in My Account, and verify persistence after reload", async ({ page }) => {
    await page.goto("http://localhost:3000/variamos_admin/#/login");

    await page.locator('input[name="email"]').fill(adminEmail);
    await page.locator('input[name="password"]').fill(adminPassword);
    const signInPromise = page.waitForResponse("**/auth/sign-in");
    await page.locator('button[type="submit"]').click();
    const signInResponse = await signInPromise;
    const signInBody = await signInResponse.json();
    if (signInBody.data?.authToken) {
      await page.evaluate((t) => {
        window.localStorage.setItem("authToken", t);
      }, signInBody.data.authToken);
    }

    await expect(page).toHaveURL("http://localhost:3000/variamos_admin/#/");

    await page.goto("http://localhost:3000/variamos_admin/#/my-account");
    await expect(page.locator("h1")).toHaveText("My account");
    await expect(page.getByText("Email:").locator("..")).toContainText(adminEmail);
    await expect(page.getByText("Country:").locator("..")).toContainText("Colombia");

    await page.getByRole("button", { name: "Edit information" }).click();

    // Verify option loaded
    await expect(page.locator('select[aria-label="Select your country"] option').first()).toBeAttached();

    await page.locator('select[aria-label="Select your country"]').selectOption("AD");
    await page.getByRole("button", { name: "Update Information" }).click();

    await expect(page.getByText("Country:").locator("..")).toContainText("Andorra");

    await page.reload();
    await expect(page.getByText("Country:").locator("..")).toContainText("Andorra");
  });

  test("should allow a new user to sign up, and then log in successfully with the new credentials", async ({ page }) => {
    const signupEmail = `new-signup-user-${suffix}@variamos-test.com`;
    const signupName = "New Signed Up User";
    const signupPassword = "Password123!";

    await page.goto("http://localhost:3000/variamos_admin/#/sign-up");

    await page.locator('input[name="name"]').fill(signupName);
    await page.locator('input[name="email"]').fill(signupEmail);
    await page.locator('input[name="password"]').fill(signupPassword);
    await page.locator('input[name="passwordConfirmation"]').fill(signupPassword);

    await page.locator('button[type="submit"]').click();
    await expect(page.locator(".alert-success")).toBeVisible();

    await page.getByText("Sign in").click();
    await expect(page).toHaveURL(/.*\/login/);
    //Making sure the previous page disappeared
    await expect(page.locator('input[name="name"]')).toBeHidden();

    await page.locator('input[name="email"]').fill(signupEmail);
    await page.locator('input[name="password"]').fill(signupPassword);
    
    const signInPromise = page.waitForResponse("**/auth/sign-in");
    await page.locator('button[type="submit"]').click();
    const signInResponse = await signInPromise;
    const signInBody = await signInResponse.json();
    if (signInBody.data?.authToken) {
      await page.evaluate((t) => {
        window.localStorage.setItem("authToken", t);
      }, signInBody.data.authToken);
    }

    await expect(page).toHaveURL("http://localhost:3000/variamos_admin/#/");
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestUsers(suffix);
  });
});
