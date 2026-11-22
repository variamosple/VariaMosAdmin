import { expect, test } from "../helpers/mockedTest";
import { json, mockSignedIn } from "../helpers/session";

// EV-90: a Google sign-in of an account without a country comes back to the
// login page with signed-in=google. The session is open already; the page
// offers the country of the browser, then leaves for the home page. The
// server side (the redirect itself) is covered by the tests of
// variamos_ms_admin: Google cannot sign a credential for a test.

test.use({ timezoneId: "America/Bogota" });

test.describe("Auth - back from a Google sign-in (EV-90)", () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedIn(page, []);
  });

  test("offers the country of the time zone, then leaves the login page", async ({
    page,
  }) => {
    await page.route("**/auth/my-account/default-country", (route) =>
      route.fulfill(json({ data: { saved: true } })),
    );

    const saved = page.waitForRequest(
      (request) =>
        request.method() === "PUT" &&
        request.url().endsWith("/auth/my-account/default-country"),
    );
    await page.goto("http://localhost:3000/#/login?signed-in=google");

    expect((await saved).postDataJSON()).toEqual({ countryCode: "CO" });
    await expect(page).not.toHaveURL(/signed-in=google/);
    // Neither the password form nor Google is offered again
    await expect(page.locator('input[name="password"]')).toHaveCount(0);
  });

  test("still leaves when the country cannot be saved", async ({ page }) => {
    await page.route("**/auth/my-account/default-country", (route) =>
      route.fulfill(json({ message: "down" }, 503)),
    );

    const tried = page.waitForRequest(
      (request) =>
        request.method() === "PUT" &&
        request.url().endsWith("/auth/my-account/default-country"),
    );
    await page.goto("http://localhost:3000/#/login?signed-in=google");

    await tried;
    await expect(page).not.toHaveURL(/signed-in=google/);
  });
});
