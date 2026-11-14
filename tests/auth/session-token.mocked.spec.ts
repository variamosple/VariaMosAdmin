import { expect, test } from "../helpers/mockedTest";
import { mockSignedIn } from "../helpers/session";

// EV-117: the session lives in the httpOnly cookie of the admin service.
// A token that an older version of variamos-components kept in
// localStorage is removed, and never sent.
test.describe("Auth - session token out of the browser storage", () => {
  test("removes a token kept by an older version and never sends it", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await mockSignedIn(page, []);

    const sentTokens: string[] = [];
    page.on("request", (request) => {
      const header = request.headers().authorization;
      if (header?.includes("stale-session-token")) sentTokens.push(header);
    });

    await page.goto("http://localhost:3000/#/login");
    await page.evaluate(() =>
      window.localStorage.setItem("authToken", "stale-session-token"),
    );

    const sessionInfo = page.waitForResponse("**/auth/session-info");
    await page.goto("http://localhost:3000/#/");
    await page.reload();
    await sessionInfo;

    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("authToken")))
      .toBeNull();
    expect(sentTokens).toEqual([]);
  });
});
