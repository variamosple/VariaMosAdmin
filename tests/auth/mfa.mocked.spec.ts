import { expect, test } from "../helpers/mockedTest";
import { ADMIN, json } from "../helpers/session";

// The second factor is completed by the session library (variamos-components
// 0.13.0, ADR-0081): the code opens the session and the page goes on without
// a reload, so what the window holds survives the sign-in.

test.describe("Auth - second factor (mocked)", () => {
  let isSignedIn: boolean;

  test.beforeEach(async ({ page, context }) => {
    isSignedIn = false;
    await context.clearCookies();
    await page.route("**/auth/session-info", (route) =>
      route.fulfill(
        isSignedIn
          ? json({ data: { user: { ...ADMIN, permissions: [] } } })
          : json({ errorCode: 401, message: "Your session has expired." }, 401),
      ),
    );
    await page.route("**/auth/my-account/preferences", (route) =>
      route.fulfill(json({ data: { timeZone: null, updatedAt: null } })),
    );
    await page.route("**/auth/my-account/default-country", (route) =>
      route.fulfill(json({ data: { saved: false } })),
    );
    await page.route("**/auth/sign-in", (route) =>
      route.fulfill(
        json({ data: { mfaRequired: true, trustedDeviceDays: 7 } }),
      ),
    );
    await page.route("**/bugs*", (route) => route.fulfill(json({ data: [] })));
    await page.route("**/languages*", (route) =>
      route.fulfill(json({ data: [] })),
    );

    await page.goto("http://localhost:3000/#/login");
    await page.locator('input[name="email"]').fill(ADMIN.email);
    await page.locator('input[name="password"]').fill("Password123!");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByLabel("Authentication code")).toBeVisible();
  });

  test("the right code opens the session without reloading the page", async ({
    page,
  }) => {
    // The home page of this application, whatever its base path
    const home = page.url().replace(/#.*$/, "#/");
    let sent: { code: string; rememberDevice: boolean } | undefined;
    await page.route("**/auth/sign-in/mfa", async (route) => {
      sent = route.request().postDataJSON();
      isSignedIn = true;
      await route.fulfill(json({ data: { id: ADMIN.id, redirect: home } }));
    });
    // Lost if the page loads again
    await page.evaluate(() => {
      (window as Window & { notReloaded?: boolean }).notReloaded = true;
    });

    await page
      .getByLabel("Don't ask for a code on this browser for 7 days")
      .check();
    await page.getByLabel("Authentication code").fill("123456");
    const sessionRead = page.waitForResponse(
      (response) =>
        response.url().endsWith("/auth/session-info") && response.ok(),
    );
    await page.getByRole("button", { name: "Verify" }).click();
    await sessionRead;

    await expect(page).toHaveURL(home);
    await expect(page.getByText(ADMIN.name)).toBeVisible();
    expect(sent).toEqual({ code: "123456", rememberDevice: true });
    expect(
      await page.evaluate(
        () => (window as Window & { notReloaded?: boolean }).notReloaded,
      ),
    ).toBe(true);
  });

  test("a wrong code keeps the code step and says why", async ({ page }) => {
    await page.route("**/auth/sign-in/mfa", (route) =>
      route.fulfill(
        json(
          { errorCode: "INVALID_INPUT", message: "The code is incorrect." },
          400,
        ),
      ),
    );

    await page.getByLabel("Authentication code").fill("000000");
    await page.getByRole("button", { name: "Verify" }).click();

    await expect(page.getByText("The code is incorrect.")).toBeVisible();
    await expect(page.getByLabel("Authentication code")).toBeVisible();
    await expect(page).toHaveURL(/#\/login/);
  });
});
