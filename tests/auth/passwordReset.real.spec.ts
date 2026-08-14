import { test, expect } from "@playwright/test";
import dbHelper from "../helpers/adminDbHelper.js";
import { login, disconnect } from "../helpers/commands";

test.describe("Admin - Password Reset Flow", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";
  const targetUserEmail = `user-test-${suffix}@variamos-test.com`;
  const disabledUserEmail = `disabled-user-${suffix}@variamos-test.com`;
  const deletedUserEmail = `deleted-user-${suffix}@variamos-test.com`;
  const newPassword = "NewSecurePassword123!";

  test.beforeEach(async () => {
    await dbHelper.seedTestUsers(suffix);
  });

  test("should allow admin to generate recovery link, and user to reset password", async ({ page }) => {
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

    const initialUsersPromise = page.waitForResponse("**/v1/users?*");
    await page.getByText("Users", { exact: true }).click();
    await expect(page).toHaveURL(/.*\/users/);
    await initialUsersPromise;

    const searchPromise = page.waitForResponse(response => 
      response.url().includes("v1/users") && response.url().includes(suffix)
    );
    await page.locator('input[id="search"]').click();
    await page.locator('input[id="search"]').fill(targetUserEmail);
    await searchPromise;

    const row = page.locator("table tbody tr", { hasText: targetUserEmail });
    await row.locator('button[title="Generate password reset link"]').click();

    const modal = page.locator(".modal-content");
    await expect(modal).toBeVisible();
    await modal.getByRole("button", { name: "Generate Secure Link" }).click();

    const linkInput = modal.locator("input");
    await expect(linkInput).toBeVisible();
    await expect(linkInput).not.toHaveValue("");
    const rawRecoveryLink = await linkInput.inputValue();
    expect(rawRecoveryLink).toContain("token=");
    const token = rawRecoveryLink.split("token=")[1];
    const recoveryLink = `/variamos_admin/#/reset-password?token=${token}`;

    await modal.locator(".modal-footer").getByRole("button", { name: "Close" }).click();

    await disconnect(page);

    const verifyTokenPromise1 = page.waitForResponse("**/auth/verify-token*");
    await page.goto(recoveryLink);
    await verifyTokenPromise1;
    await page.waitForURL(/.*reset-password.*/);
    await page.locator('input[id="new_password"]').waitFor({ state: "visible" });

    await page.locator('input[id="new_password"]').fill(adminPassword);
    await page.locator('input[id="confirm_password"]').fill(adminPassword);
    const resetPromise1 = page.waitForResponse("**/auth/reset-password");
    await page.locator('button[type="submit"]').click();
    await resetPromise1;
    await expect(page.getByText("New password must be different from the current one.")).toBeVisible();

    await page.locator('input[id="new_password"]').fill(newPassword);
    await page.locator('input[id="confirm_password"]').fill(newPassword);
    const resetPromise2 = page.waitForResponse("**/auth/reset-password");
    await page.locator('button[type="submit"]').click();
    await resetPromise2;

    await expect(page.getByText("Your password has been reset successfully !")).toBeVisible();
    await page.getByText("Back to Sign In").click();
    await expect(page).toHaveURL(/.*\/login/);

    await page.locator('input[name="email"]').fill(targetUserEmail);
    await page.locator('input[name="password"]').fill(newPassword);
    const signInPromise2 = page.waitForResponse("**/auth/sign-in");
    await page.locator('button[type="submit"]').click();
    const signInResponse2 = await signInPromise2;
    const signInBody2 = await signInResponse2.json();
    if (signInBody2.data?.authToken) {
      await page.evaluate((t) => {
        window.localStorage.setItem("authToken", t);
      }, signInBody2.data.authToken);
    }
    await expect(page).toHaveURL("http://localhost:3000/variamos_admin/#/");
  });

  test("should allow public user to request password reset, receive simulated email, and reset password", async ({ page }) => {
    const smtpEmail = `user-smtp-${suffix}@variamos-test.com`;

    await page.goto("http://localhost:3000/variamos_admin/#/forgot-password");
    await page.locator('input[type="email"]').fill(smtpEmail);

    const forgotPasswordPromise = page.waitForResponse("**/auth/forgot-password");
    await page.locator('button[type="submit"]').click();
    await forgotPasswordPromise;

    await expect(page.getByText("If an account with this email exists, a password reset link has been sent. Please check your inbox!")).toBeVisible();

    const tokenHash = await dbHelper.getLatestResetToken(smtpEmail);
    expect(tokenHash).not.toBeNull();

    const recoveryLink = `/variamos_admin/#/reset-password?token=${tokenHash}`;
    const verifyTokenPromise2 = page.waitForResponse("**/auth/verify-token*");
    await page.goto(recoveryLink);
    await verifyTokenPromise2;
    await page.waitForURL(/.*reset-password.*/);
    await page.locator('input[id="new_password"]').waitFor({ state: "visible" });

    await page.locator('input[id="new_password"]').fill(newPassword);
    await page.locator('input[id="confirm_password"]').fill(newPassword);
    const resetPromise3 = page.waitForResponse("**/auth/reset-password");
    await page.locator('button[type="submit"]').click();
    await resetPromise3;

    await expect(page.getByText("Your password has been reset successfully !")).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/, { timeout: 6000 });

    await page.locator('input[name="email"]').fill(smtpEmail);
    await page.locator('input[name="password"]').fill(newPassword);
    
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

  test("should invalidate token after first use and prevent reuse", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    const initialUsersPromise = page.waitForResponse("**/v1/users?*");
    await page.getByText("Users", { exact: true }).click();
    await initialUsersPromise;

    const searchPromise = page.waitForResponse(response => 
      response.url().includes("v1/users") && response.url().includes(suffix)
    );
    await page.locator('input[id="search"]').click();
    await page.locator('input[id="search"]').fill(targetUserEmail);
    await searchPromise;

    const row = page.locator("table tbody tr", { hasText: targetUserEmail });
    await row.locator('button[title="Generate password reset link"]').click();

    const modal = page.locator(".modal-content");
    await expect(modal).toBeVisible();
    await modal.getByRole("button", { name: "Generate Secure Link" }).click();

    const linkInput = modal.locator("input");
    await expect(linkInput).toBeVisible();
    await expect(linkInput).not.toHaveValue("");
    const rawRecoveryLink = await linkInput.inputValue();
    expect(rawRecoveryLink).toContain("token=");
    const token = rawRecoveryLink.split("token=")[1];
    const recoveryLink = `/variamos_admin/#/reset-password?token=${token}`;

    await modal.locator(".modal-footer").getByRole("button", { name: "Close" }).click();
    await disconnect(page);

    const verifyTokenPromise3 = page.waitForResponse("**/auth/verify-token*");
    await page.goto(recoveryLink);
    await verifyTokenPromise3;
    await page.waitForURL(/.*reset-password.*/);
    await page.locator('input[id="new_password"]').waitFor({ state: "visible" });
    await page.locator('input[id="new_password"]').fill(newPassword);
    await page.locator('input[id="confirm_password"]').fill(newPassword);
    const resetPromise4 = page.waitForResponse("**/auth/reset-password");
    await page.locator('button[type="submit"]').click();
    await resetPromise4;
    await expect(page.getByText("Your password has been reset successfully !")).toBeVisible();

    await page.goto("/variamos_admin/#/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();

    const verifyTokenPromise4 = page.waitForResponse("**/auth/verify-token*");
    await page.goto(recoveryLink);
    await verifyTokenPromise4;
    await page.waitForURL(/.*reset-password.*/);
    await page.getByText("This password reset link is invalid, has expired, or has already been used.").waitFor({ state: "visible" });
    await expect(page.getByText("This password reset link is invalid, has expired, or has already been used.")).toBeVisible();
    await expect(page.locator('input[id="new_password"]')).not.toBeVisible();
  });

  test("should not allow password recovery for disabled or deleted accounts", async ({ page, context }) => {
    await login(page, adminEmail, adminPassword);
    const initialUsersPromise = page.waitForResponse("**/v1/users?*");
    await page.getByText("Users", { exact: true }).click();
    await initialUsersPromise;

    const searchPromise1 = page.waitForResponse(response => 
      response.url().includes("v1/users") && response.url().includes(suffix)
    );
    await page.locator('input[id="search"]').click();
    await page.locator('input[id="search"]').fill(disabledUserEmail);
    await searchPromise1;

    const disabledRow = page.locator("tr", { hasText: disabledUserEmail });
    await expect(disabledRow.locator('button[title="Generate password reset link"]')).not.toBeVisible();

    const searchPromise2 = page.waitForResponse(response => 
      response.url().includes("v1/users") && response.url().includes(suffix)
    );
    await page.locator('input[id="search"]').click();
    await page.locator('input[id="search"]').fill(deletedUserEmail);
    await searchPromise2;

    const deletedRow = page.locator("tr", { hasText: deletedUserEmail });
    await expect(deletedRow.locator('button[title="Generate password reset link"]')).not.toBeVisible();

    await disconnect(page);

    // Direct API call security check
    const requestContext = context.request;
    await requestContext.post("http://localhost:4000/auth/forgot-password", {
      data: { email: disabledUserEmail }
    });

    const token = await dbHelper.getLatestResetToken(disabledUserEmail);
    expect(token).toBeNull();
  });

  test("should reject password reset if the token has expired", async ({ page }) => {
    const expiredToken = "expired-token-uuid-1234";
    await dbHelper.insertExpiredToken({ email: targetUserEmail, token: expiredToken });

    const recoveryLink = `/variamos_admin/#/reset-password?token=${expiredToken}`;
    const verifyTokenPromise5 = page.waitForResponse("**/auth/verify-token*");
    await page.goto(recoveryLink);
    await verifyTokenPromise5;
    await page.waitForURL(/.*reset-password.*/);
    await page.getByText("This password reset link is invalid, has expired, or has already been used.").waitFor({ state: "visible" });

    await expect(page.getByText("This password reset link is invalid, has expired, or has already been used.")).toBeVisible();
    await expect(page.locator('input[id="new_password"]')).not.toBeVisible();
  });

  test("should prevent double-clicking the submit button", async ({ page }) => {
    await page.route("**/auth/forgot-password", async (route) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto("http://localhost:3000/variamos_admin/#/forgot-password");
    await page.locator('input[type="email"]').fill(targetUserEmail);

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await expect(submitBtn).toBeDisabled();
  });

  test("should validate form rules (email and password inputs)", async ({ page }) => {
    await page.goto("http://localhost:3000/variamos_admin/#/forgot-password");
    await page.locator('input[type="email"]').fill("temp");
    await page.locator('input[type="email"]').clear();
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    const dummyLink = "http://localhost:3000/variamos_admin/#/reset-password?token=dummy_valid_token";
    await page.route("**/verify-token*", async (route) => route.fulfill({ status: 200 }));

    const verifyTokenPromise6 = page.waitForResponse("**/auth/verify-token*");
    await page.goto(dummyLink);
    await verifyTokenPromise6;
    await page.waitForURL(/.*reset-password.*/);
    await page.locator('input[id="new_password"]').waitFor({ state: "visible" });
    await page.locator('input[id="new_password"]').fill("Password123!");
    await page.locator('input[id="confirm_password"]').fill("DifferentPassword123!");
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.getByText("Passwords do not match")).toBeVisible();

    await page.locator('input[id="new_password"]').fill("short");
    await page.locator('input[id="confirm_password"]').fill("short");
    await expect(page.getByText("Password must be between 8 and 24 characters and include uppercase, lowercase, number, and special character.")).toBeVisible();
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestUsers(suffix);
  });
});