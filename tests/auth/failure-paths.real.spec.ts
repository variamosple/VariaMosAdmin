import { expect, type Page, test } from "@playwright/test";
import dbHelper from "../helpers/adminDbHelper.js";
import { login } from "../helpers/commands.js";

const ADMIN_API = "http://localhost:4000";
const LOGIN_PAGE = "/variamos_admin/#/login";

// The failure paths of the sign-in and of the access control, on the real
// services: each refusal opens no session and shows why
test.describe("Admin - Sign-in and access failures", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);
  const password = "Password123!";
  const userEmail = `user-test-${suffix}@variamos-test.com`;
  const smtpEmail = `user-smtp-${suffix}@variamos-test.com`;
  const disabledEmail = `disabled-user-${suffix}@variamos-test.com`;
  const deletedEmail = `deleted-user-${suffix}@variamos-test.com`;

  test.beforeAll(async () => {
    await dbHelper.seedTestUsers(suffix);
  });

  test.afterAll(async () => {
    await dbHelper.cleanTestUsers(suffix);
  });

  const signInWithForm = async (page: Page, email: string, secret: string) => {
    await page.goto(LOGIN_PAGE);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(secret);
    const answer = page.waitForResponse("**/auth/sign-in");
    await page.locator('button[type="submit"]').click();
    return answer;
  };

  const expectNoSession = async (page: Page) => {
    const cookies = await page.context().cookies();
    expect(cookies.map((cookie) => cookie.name)).not.toContain("authToken");
    await expect(page).toHaveURL(/#\/login/);
  };

  test("refuses a wrong password and opens no session", async ({ page }) => {
    const answer = await signInWithForm(page, userEmail, "WrongPassword123!");

    expect(answer.status()).toBeGreaterThanOrEqual(400);
    await expect(page.getByRole("alert")).toContainText(
      "Incorrect username or password.",
    );
    await expectNoSession(page);
  });

  test("refuses a disabled or deleted account with the same answer as a wrong password", async ({
    page,
  }) => {
    // The answer does not tell which accounts exist or are closed
    for (const email of [disabledEmail, deletedEmail]) {
      const answer = await signInWithForm(page, email, password);

      expect(answer.status()).toBeGreaterThanOrEqual(400);
      await expect(page.getByRole("alert")).toContainText(
        "Incorrect username or password.",
      );
      await expectNoSession(page);
    }
  });

  test("locks an account after ten failed sign-ins, even with the right password", async ({
    page,
  }) => {
    // Default lockout: 10 failures in a row lock the account for 15 minutes
    for (let attempt = 1; attempt <= 10; attempt++) {
      const failed = await page
        .context()
        .request.post(`${ADMIN_API}/auth/sign-in`, {
          data: { email: smtpEmail, password: `Wrong-${attempt}` },
        });
      expect(failed.status()).toBeGreaterThanOrEqual(400);
    }

    const answer = await signInWithForm(page, smtpEmail, password);

    expect(answer.status()).toBe(429);
    expect(Number(answer.headers()["retry-after"])).toBeGreaterThan(0);
    await expect(page.getByRole("alert")).toContainText("Too many attempts");
    await expectNoSession(page);
  });

  test("refuses a page and its API to a user without the permission", async ({
    page,
  }) => {
    // The seeded user has no role, so no permission
    await login(page, userEmail, password);
    await expect(page).toHaveURL(/variamos_admin\/(#\/)?$/);

    await page.goto("/variamos_admin/#/users");
    await expect(page).toHaveURL(/#\/403/);
    await expect(
      page.getByText("You are not authorized to access this page."),
    ).toBeVisible();

    // The server refuses it too, whatever the interface shows
    const users = await page.context().request.get(`${ADMIN_API}/v1/users`);
    expect(users.status()).toBe(403);
  });
});
