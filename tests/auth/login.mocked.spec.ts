import { test, expect } from "@playwright/test";

test.describe("Auth - Login Mocked Flows", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

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

    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.goto("http://localhost:3000/#/login");
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("should show error notification when sign-in fails (sad path)", async ({ page }) => {
    await page.route("**/auth/sign-in", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          errorCode: 401,
          message: "Invalid email or password"
        })
      });
    });

    await page.locator('input[name="email"]').fill("wrong@variamos-test.com");
    await page.locator('input[name="password"]').fill("WrongPassword123!");
    
    const responsePromise = page.waitForResponse("**/auth/sign-in");
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("should log in successfully and redirect to the dashboard (happy path)", async ({ page }) => {
    let isLoggedIn = false;
    
    await page.route("**/auth/session-info", async (route) => {
      if (isLoggedIn) {
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
              }
            }
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            errorCode: 401,
            message: "Your session has expired, please log in again."
          })
        });
      }
    });

    await page.route("**/auth/sign-in", async (route) => {
      isLoggedIn = true;
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
            },
            authToken: "mock-auth-token-1234"
          }
        })
      });
    });

    // Mock initial queries on landing page
    await page.route("**/bugs/repos", async (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
    await page.route("**/bugs*", async (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
    await page.route("**/bugs/categories", async (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
    await page.route("**/languages*", async (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));

    await page.locator('input[name="email"]').fill("admin@variamos-test.com");
    await page.locator('input[name="password"]').fill("Password123!");

    const signInPromise = page.waitForResponse("**/auth/sign-in");
    const sessionInfoPromise = page.waitForResponse("**/auth/session-info");
    await page.locator('button[type="submit"]').click();
    await signInPromise;
    await sessionInfoPromise;

    await expect(page).toHaveURL("http://localhost:3000/#/");
  });

  test("should allow navigating to forgot password, validate empty input, and show success message on submit (mocked)", async ({ page }) => {
    await page.getByText("Forgot Password?").click();
    await expect(page).toHaveURL(/.*\/forgot-password/);

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

    const forgotPasswordPromise = page.waitForResponse("**/auth/forgot-password");
    await page.locator('button[type="submit"]').click();
    await forgotPasswordPromise;

    await expect(page.getByText("If an account with this email exists, a password reset link has been sent. Please check your inbox!")).toBeVisible();
  });
});