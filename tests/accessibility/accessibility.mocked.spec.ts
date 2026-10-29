import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// WCAG 2.1 A and AA rules, checked by axe-core on the main screens (EV-96)
const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const json = (data: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(data),
});

const violations = async (page: Page) => {
  // Measured on a settled page: during the session check the guest button is
  // disabled, and its colour then takes 0.15 s to turn back; axe measuring in
  // between reports a contrast that no user sees (flaky in CI before).
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          !(animation instanceof CSSTransition) ||
          animation.playState !== "running",
      ),
  );
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  // Readable on failure: rule, impact and the first elements concerned
  return results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    targets: violation.nodes.slice(0, 3).map((node) => node.target.join(" ")),
  }));
};

test.describe("Accessibility - signed out screens", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.route("**/auth/session-info", (route) =>
      route.fulfill(json({ errorCode: 401, message: "No session" }, 401)),
    );
  });

  for (const [name, path, heading] of [
    ["sign in", "/#/login", /sign in/i],
    ["sign up", "/#/sign-up", /sign up/i],
    ["forgot password", "/#/forgot-password", /reset/i],
  ] as const) {
    test(`the ${name} screen has no WCAG A or AA violation`, async ({
      page,
    }) => {
      await page.goto(`http://localhost:3000${path}`);
      await expect(
        page.getByRole("button", { name: heading }).first(),
      ).toBeVisible();

      expect(await violations(page)).toEqual([]);
    });
  }
});

test.describe("Accessibility - signed in screens", () => {
  const signIn = async (page: Page, permissions: string[]) => {
    await page.route("**/auth/session-info", (route) =>
      route.fulfill(
        json({
          data: {
            user: {
              id: "admin-1",
              user: "admin",
              name: "Admin User",
              email: "admin@example.com",
              roles: ["Admin"],
              permissions,
            },
          },
        }),
      ),
    );
  };

  test("the users list has no WCAG A or AA violation", async ({ page }) => {
    await signIn(page, ["users::query", "users::update", "users::delete"]);
    await page.route("**/v1/users*", (route) =>
      route.fulfill(
        json({
          data: [
            {
              id: "u1",
              user: "john_doe",
              name: "John Doe",
              email: "john@example.com",
              isEnabled: true,
              isDeleted: false,
              createdAt: "2026-07-20T10:00:00Z",
              lastLogin: "2026-07-23T15:00:00Z",
            },
          ],
          totalCount: 1,
        }),
      ),
    );

    await page.goto("http://localhost:3000/#/users");
    await expect(page.getByRole("cell", { name: "John Doe" })).toBeVisible();

    expect(await violations(page)).toEqual([]);
  });

  test("the notifications page has no WCAG A or AA violation", async ({
    page,
  }) => {
    await signIn(page, [
      "admin::notifications::dispatch",
      "users::query",
      "roles::query",
    ]);
    await page.route("**/v1/roles*", (route) =>
      route.fulfill(json({ data: [{ id: 1, name: "Administrator" }] })),
    );

    await page.goto("http://localhost:3000/#/admin/notifications");
    await expect(page.getByLabel("Notification Title")).toBeVisible();

    expect(await violations(page)).toEqual([]);
  });
});
