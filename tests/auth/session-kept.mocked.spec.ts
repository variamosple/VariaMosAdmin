import type { Page, Route } from "@playwright/test";
import { expect, test } from "../helpers/mockedTest";
import { ADMIN, json } from "../helpers/session";

// ADM-N09: only the admin ends a session. While it does not answer (a
// restart at each deployment, a proxy error, no network), the page and what
// was typed in it are kept, and the sign in page is never shown.

type AdminState = "signed-in" | "down" | "gateway-error" | "signed-out";

const UNREACHABLE =
  "The server cannot be reached. Your session and this page are kept; trying again…";

/** Answers the session check as the admin would in the given state. */
const mockAdmin = async (page: Page, state: { current: AdminState }) => {
  await page.route("**/auth/session-info", (route: Route) => {
    switch (state.current) {
      case "signed-in":
        return route.fulfill(
          json({ data: { user: { ...ADMIN, permissions: ["roles::query"] } } }),
        );
      case "down":
        return route.abort("connectionrefused");
      case "gateway-error":
        return route.fulfill({
          status: 502,
          contentType: "text/html",
          body: "<html><body>502 Bad Gateway</body></html>",
        });
      case "signed-out":
        return route.fulfill(
          json({ errorCode: 401, message: "Please log in." }, 401),
        );
    }
  });
  await page.route("**/auth/my-account/preferences", (route) =>
    route.fulfill(json({ data: { timeZone: null, updatedAt: null } })),
  );
  await page.route("**/v1/roles*", (route) =>
    route.fulfill(
      json({
        data: [{ id: 10, name: "Administrator" }],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
      }),
    ),
  );
};

/** Opens the new role form and types a name in it. */
const startTypingARole = async (page: Page) => {
  await page.goto("http://localhost:3000/#/roles");
  await page.getByRole("button", { name: "Create role" }).click();
  const dialog = page.getByRole("dialog", { name: "New role" });
  await dialog.getByLabel("Role name").fill("Reviewers");
  return dialog;
};

test.describe("Auth - session kept while the admin does not answer", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.clock.install();
  });

  for (const outage of ["down", "gateway-error"] as const) {
    test(`keeps the page and the form while the admin is ${outage}`, async ({
      page,
    }) => {
      const admin = { current: "signed-in" as AdminState };
      await mockAdmin(page, admin);
      const dialog = await startTypingARole(page);

      admin.current = outage;
      await page.clock.fastForward(60_000);
      await expect(page.getByRole("status")).toHaveText(UNREACHABLE);

      // Still unreachable after the next tries: never sent to sign in
      await page.clock.fastForward(5_000);
      await page.clock.fastForward(10_000);
      await expect(page).toHaveURL(/#\/roles/);
      await expect(dialog.getByLabel("Role name")).toHaveValue("Reviewers");

      admin.current = "signed-in";
      await page.clock.fastForward(20_000);
      await expect(page.getByText(UNREACHABLE)).toBeHidden();
      await expect(dialog.getByLabel("Role name")).toHaveValue("Reviewers");
    });
  }

  test("sends to the sign in page when the admin says the session is over", async ({
    page,
  }) => {
    const admin = { current: "signed-in" as AdminState };
    await mockAdmin(page, admin);
    await page.goto("http://localhost:3000/#/roles");
    await expect(
      page.getByRole("button", { name: "Create role" }),
    ).toBeVisible();

    admin.current = "signed-out";
    await page.clock.fastForward(60_000);
    await page.clock.fastForward(1_000);
    await expect(page).toHaveURL(/#\/login/);
  });

  // TRV-65: an ended session stays ended, but a form being typed is kept
  // until its author has copied it or chosen to drop it
  test("keeps a role being typed when the session is over, until it is dropped", async ({
    page,
  }) => {
    const admin = { current: "signed-in" as AdminState };
    await mockAdmin(page, admin);
    const dialog = await startTypingARole(page);

    admin.current = "signed-out";
    await page.clock.fastForward(60_000);
    await page.clock.fastForward(1_000);
    const banner = page.getByRole("alert").filter({
      hasText: "Your session has ended. Your input is still on this page",
    });
    await expect(banner).toBeVisible();
    await expect(page).toHaveURL(/#\/roles/);
    await expect(dialog.getByLabel("Role name")).toHaveValue("Reviewers");

    await banner.getByRole("button", { name: "Sign in here" }).click();
    await banner
      .getByRole("button", { name: "Drop my input and sign in" })
      .click();
    await expect(page).toHaveURL(/#\/login/);
  });

  // EV-96: the dialog traps the focus and hides the page from screen
  // readers; the banner goes into it, first
  test("shows the banner inside the open dialog, reached from the keyboard", async ({
    page,
  }) => {
    const admin = { current: "signed-in" as AdminState };
    await mockAdmin(page, admin);
    const dialog = await startTypingARole(page);

    admin.current = "signed-out";
    await page.clock.fastForward(60_000);
    await page.clock.fastForward(1_000);
    const banner = dialog.getByRole("alert").filter({
      hasText: "Your session has ended. Your input is still on this page",
    });
    await expect(banner).toBeVisible();

    const signInHere = banner.getByRole("button", { name: "Sign in here" });
    await dialog.getByLabel("Role name").focus();
    for (let presses = 0; presses < 6; presses++) {
      if (await signInHere.evaluate((el) => el === document.activeElement)) {
        break;
      }
      await page.keyboard.press("Shift+Tab");
    }
    await expect(signInHere).toBeFocused();
    await expect(dialog.getByLabel("Role name")).toHaveValue("Reviewers");
  });

  test("waits for the admin on a first load instead of asking to sign in", async ({
    page,
  }) => {
    const admin = { current: "down" as AdminState };
    await mockAdmin(page, admin);
    await page.goto("http://localhost:3000/#/roles");

    await expect(page.getByRole("status")).toHaveText(
      "The server cannot be reached. Trying again…",
    );
    await page.clock.fastForward(1_000);
    await expect(page).toHaveURL(/#\/roles/);

    admin.current = "signed-in";
    await page.clock.fastForward(5_000);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Administrator")).toBeVisible();
  });
});
