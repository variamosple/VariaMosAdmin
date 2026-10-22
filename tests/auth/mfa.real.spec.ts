import { expect, type Page, test } from "@playwright/test";
import dbHelper from "../helpers/adminDbHelper.js";
import { totp } from "../helpers/totp";

// Two-factor authentication against the real admin (SPC-2026-10-17-001)

/** The home page, at the address the server gives (with or without hash). */
const HOME = /^http:\/\/localhost:3000\/variamos_admin\/(#\/?)?$/;

test.describe("Two-factor authentication - Real E2E", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random().toString(36).substring(2, 8);
  const email = `admin-${suffix}@variamos-test.com`;
  const password = "Password123!";

  test.beforeAll(async () => {
    await dbHelper.seedTestUsers(suffix);
  });

  // A fresh page each time: the session library keeps the previous
  // session in memory until the page is loaded again
  const signIn = async (page: Page) => {
    await page.context().clearCookies();
    await page.goto("http://localhost:3000/variamos_admin/#/login");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
  };

  test("turns the factor on, then asks for the code at sign-in", async ({
    page,
  }) => {
    // A whole journey: enrollment, three sign-ins, removal
    test.setTimeout(90_000);
    await signIn(page);
    await expect(page).toHaveURL("http://localhost:3000/variamos_admin/#/");

    await page.goto("http://localhost:3000/variamos_admin/#/my-account");
    await page.getByRole("button", { name: "Turn on" }).click();
    await page.getByLabel("Confirm your password").fill(password);
    await page.getByRole("button", { name: "Continue" }).click();

    // The QR code is drawn in the browser: the secret leaves for no service
    await expect(page.getByRole("dialog").locator("svg").first()).toBeVisible();
    await expect(page.getByTestId("mfa-secret")).toBeVisible();
    const secret = (await page.getByTestId("mfa-secret").textContent()) ?? "";
    await page.getByLabel("Code from the app").fill(totp(secret));
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Turn on" })
      .click();

    const codes = page.getByTestId("recovery-codes").getByRole("listitem");
    await expect(codes).toHaveCount(10);
    const recoveryCode = (await codes.first().textContent()) ?? "";
    const otherRecoveryCode = (await codes.nth(1).textContent()) ?? "";
    await page.getByRole("button", { name: "I have saved them" }).click();
    await expect(page.getByText("On", { exact: true })).toBeVisible();

    // The password alone no longer opens a session
    await signIn(page);
    await expect(page.getByLabel("Authentication code")).toBeVisible();
    await expect(page).toHaveURL(/#\/login/);

    await page.getByLabel("Authentication code").fill("000000");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByText("The code is incorrect.")).toBeVisible();

    // The next step: the one used to turn the factor on is spent
    // The right code reloads the page: submit without waiting on the button
    await page.getByLabel("Authentication code").fill(totp(secret, 1));
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(HOME);
    await expect(
      page.getByText(/Welcome to the VariaMos admin module/),
    ).toBeVisible();
    await page.goto("http://localhost:3000/variamos_admin/#/my-account");
    await expect(page.locator("h1")).toHaveText("My account");

    // A recovery code works once, then turns the factor off
    await signIn(page);
    await page.getByLabel("Authentication code").fill(recoveryCode);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(HOME);
    await expect(
      page.getByText(/Welcome to the VariaMos admin module/),
    ).toBeVisible();

    await page.goto("http://localhost:3000/variamos_admin/#/my-account");
    await expect(page.getByText(/9 recovery code\(s\) left/)).toBeVisible();
    await page.getByRole("button", { name: "Turn off" }).click();
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .getByLabel("Code from the app, or a recovery code")
      .fill(recoveryCode);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Turn off" })
      .click();
    await expect(page.getByText("The code is incorrect.")).toBeVisible();

    await page
      .getByLabel("Code from the app, or a recovery code")
      .fill(otherRecoveryCode);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Turn off" })
      .click();
    await expect(page.getByText("Off", { exact: true })).toBeVisible();

    await signIn(page);
    await expect(page).toHaveURL("http://localhost:3000/variamos_admin/#/");
  });

  test("skips the code on a browser the user trusted, until forgotten", async ({
    page,
    browserName,
  }) => {
    // The trusted cookie is Secure: WebKit drops it over http://localhost,
    // while production is served over HTTPS
    test.skip(
      browserName === "webkit",
      "WebKit drops Secure cookies over http://localhost",
    );
    test.setTimeout(90_000);
    // Signs out but keeps the browser, and so its trusted cookie
    const signInAgain = async () => {
      await page.context().clearCookies({ name: "authToken" });
      await page.goto("http://localhost:3000/variamos_admin/#/login");
      await page.evaluate(() => window.localStorage.clear());
      await page.reload();
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').fill(password);
      await page.locator('button[type="submit"]').click();
    };

    await signIn(page);
    await expect(page).toHaveURL("http://localhost:3000/variamos_admin/#/");
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
    const recoveryCode =
      (await page
        .getByTestId("recovery-codes")
        .getByRole("listitem")
        .first()
        .textContent()) ?? "";
    await page.getByRole("button", { name: "I have saved them" }).click();

    // The code, with the choice not to be asked again here
    await signInAgain();
    const remember = page.getByLabel(
      "Don't ask for a code on this browser for 14 days",
    );
    await expect(remember).not.toBeChecked();
    await remember.check();
    await page.getByLabel("Authentication code").fill(totp(secret, 1));
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(HOME);

    // Same browser: the password is enough
    await signInAgain();
    await expect(page).toHaveURL(HOME);
    await expect(
      page.getByText(/Welcome to the VariaMos admin module/),
    ).toBeVisible();

    // Another browser still asks the code
    await signIn(page);
    await expect(page.getByLabel("Authentication code")).toBeVisible();
    // Two steps ahead is out of the window: a recovery code instead
    await page.getByLabel("Authentication code").fill(recoveryCode);
    await page.getByLabel(/Don't ask for a code/).check();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(HOME);

    // Forgotten from My account: the code is asked again
    await page.goto("http://localhost:3000/variamos_admin/#/my-account");
    await page
      .getByRole("button", {
        name: "Ask for the code again on all my browsers",
      })
      .click();
    await expect(page.getByRole("status")).toHaveText(
      "Done: every browser will ask for the code again.",
    );
    await signInAgain();
    await expect(page.getByLabel("Authentication code")).toBeVisible();
  });
});
