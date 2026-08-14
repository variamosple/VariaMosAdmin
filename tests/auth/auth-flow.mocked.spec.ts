import { test, expect } from "@playwright/test";

test.describe("Auth - Comprehensive Mocked Flows", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    
    // Default session mock (not logged in)
    await page.route("**/auth/session-info", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          errorCode: 401,
          message: "Your session has expired, please log in again."
        })
      });
    });
  });

  test.describe("Sign In", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await page.goto("http://localhost:3000/#/login");
    });

    test("should validate sign-in form inputs (empty values and syntax validation)", async ({ page }) => {
      await page.locator('button[type="submit"]').click();
      await expect(page.getByText("Email is required")).toBeVisible();
      await expect(page.getByText("Password is required")).toBeVisible();

      await page.locator('input[name="email"]').fill("invalid-email");
      await page.locator('input[name="password"]').fill("123");
      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/.*\/login/);
    });
  });

  test.describe("Sign Up", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await page.goto("http://localhost:3000/#/sign-up");
    });

    test("should show validation errors for empty fields and password mismatch in sign-up", async ({ page }) => {
      await page.locator('button[type="submit"]').click();
      await expect(page.getByText("Full name is required")).toBeVisible();
      await expect(page.getByText("Email is required")).toBeVisible();
      await expect(page.getByText("password is required")).toBeVisible();
      await expect(page.getByText("Please confirm your password")).toBeVisible();

      await page.locator('input[name="name"]').fill("John Doe");
      await page.locator('input[name="email"]').fill("john@example.com");
      await page.locator('input[name="password"]').fill("Password123!");
      await page.locator('input[name="passwordConfirmation"]').fill("Different123!");
      await page.locator('button[type="submit"]').click();

      await expect(page.getByText("Passwords do not match")).toBeVisible();
    });
  });

  test.describe("Forgot Password", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await page.goto("http://localhost:3000/#/forgot-password");
    });

    test("should validate input and redirect / show confirmation on success", async ({ page }) => {
      await page.locator('button[type="submit"]').click();
      await expect(page.getByText("Email is required")).toBeVisible();

      await page.route("**/auth/forgot-password", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Email sent successfully"
          })
        });
      });

      await page.locator('input[name="email"]').fill("user@variamos-test.com");
      
      const responsePromise = page.waitForResponse("**/auth/forgot-password");
      await page.locator('button[type="submit"]').click();
      await responsePromise;

      await expect(page.getByText("If an account with this email exists, a password reset link has been sent. Please check your inbox!")).toBeVisible();
    });
  });
});