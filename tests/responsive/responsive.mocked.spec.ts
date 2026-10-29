import { expect, type Page, test } from "@playwright/test";

// MA-NF-10: the main screens are usable at 375, 768 and 1440 px without
// horizontal scrolling of the page (EV-95). A table may scroll inside its own
// frame: every column and action stays reachable.
const WIDTHS = [375, 768, 1440];

const json = (data: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(data),
});

const PERMISSIONS = [
  "users::query",
  "users::update",
  "users::delete",
  "roles::query",
  "roles::update",
  "permissions::query",
  "bugs::query",
  "micro-services::query",
  "configurations::query",
];

// Long values: a short sample would hide the columns that do not wrap
const user = {
  id: "u1",
  user: "john_doe_with_a_long_username",
  name: "John Doe Withaverylongname",
  email: "a-rather-long-address-that-does-not-wrap@example-domain.com",
  isEnabled: true,
  isDeleted: false,
  createdAt: "2026-07-20T10:00:00Z",
  lastLogin: "2026-07-23T15:00:00Z",
};
const role = { id: 1, name: "Administrator of the whole platform" };
const permission = { id: 12, name: "configurations::update" };

const MENU = {
  items: [
    { title: "Home", type: "location", location: "https://app.variamos.com/" },
    {
      title: "Admin",
      type: "location",
      location: "https://app.variamos.com/variamos_admin/",
    },
  ],
  subMenu: [
    {
      accessibleFrom: "/variamos_admin/",
      items: ["Users", "Roles", "Permissions", "Monitoring", "Bugs"].map(
        (title) => ({ title, location: `/${title.toLowerCase()}` }),
      ),
    },
  ],
};

const signIn = async (page: Page) => {
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
            permissions: PERMISSIONS,
          },
        },
      }),
    ),
  );
  await page.route("**/v1/configurations/menu", (route) =>
    route.fulfill(json({ data: MENU })),
  );
  const list = (data: unknown[]) => json({ data, totalCount: data.length });
  await page.route("**/v1/users**", (route) => {
    const url = route.request().url();
    if (url.includes("/users/u1/roles")) return route.fulfill(list([role]));
    if (url.includes("/users/u1")) return route.fulfill(json({ data: user }));
    return route.fulfill(list([user, user]));
  });
  await page.route("**/v1/roles**", (route) => {
    const url = route.request().url();
    if (url.includes("/roles/1/permissions")) {
      return route.fulfill(list([permission, permission]));
    }
    if (url.includes("/roles/1")) return route.fulfill(json({ data: role }));
    return route.fulfill(list([role, role]));
  });
  await page.route("**/v1/permissions**", (route) =>
    route.fulfill(list([permission, permission])),
  );
  for (const path of ["bugs", "micro-services", "configurations"]) {
    await page.route(`**/v1/${path}?**`, (route) => route.fulfill(list([])));
  }
};

// Elements that stick out of the window, outside the header and outside any
// frame that scrolls by itself (the responsive tables)
const overflowingContent = (page: Page) =>
  page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const scrollsItself = (element: Element) => {
      for (let node = element.parentElement; node; node = node.parentElement) {
        if (["auto", "scroll"].includes(getComputedStyle(node).overflowX)) {
          return true;
        }
      }
      return false;
    };
    return [...document.body.querySelectorAll("*")]
      .filter(
        (element) =>
          element.getBoundingClientRect().right > width + 1 &&
          !element.closest("header") &&
          !scrollsItself(element),
      )
      .slice(0, 3)
      .map((element) => element.outerHTML.slice(0, 120));
  });

const pageOverflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

const SCREENS = [
  { name: "users list", path: "/#/users", heading: "Users list" },
  { name: "user detail", path: "/#/users/u1", heading: "User information" },
  { name: "roles list", path: "/#/roles", heading: "Roles list" },
  { name: "role detail", path: "/#/roles/1", heading: role.name },
  {
    name: "permissions list",
    path: "/#/permissions",
    heading: "Permissions list",
  },
  { name: "bugs list", path: "/#/bugs", heading: "Bugs list" },
  {
    name: "monitoring",
    path: "/#/monitoring",
    heading: "Microservices & System Status",
  },
  {
    name: "configurations",
    path: "/#/configurations",
    heading: "Global Configurations",
  },
  { name: "my account", path: "/#/my-account", heading: "My account" },
];

for (const width of WIDTHS) {
  test.describe(`Responsive - ${width} px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("the sign in screen fits the window", async ({ page }) => {
      await page.route("**/auth/session-info", (route) =>
        route.fulfill(json({ errorCode: 401, message: "No session" }, 401)),
      );
      await page.goto("/#/login");
      await expect(
        page.getByRole("button", { name: /sign in/i }).first(),
      ).toBeVisible();

      expect(await pageOverflow(page)).toBe(0);
    });

    for (const screen of SCREENS) {
      test(`the ${screen.name} content fits the window`, async ({ page }) => {
        await signIn(page);
        await page.goto(screen.path);
        await expect(
          page.getByRole("heading", { name: screen.heading }),
        ).toBeVisible();
        await page.waitForLoadState("networkidle");

        expect(await overflowingContent(page)).toEqual([]);
      });
    }

    test("the signed in page does not scroll sideways", async ({ page }) => {
      // Known defect at 375 px: the header of @variamosple/variamos-components
      // does not fold, and pushes the account menu out of the window. When
      // the library fixes it, this test passes and Playwright reports it:
      // remove this line then.
      test.fail(width < 576, "header of variamos-components, not folded");

      await signIn(page);
      await page.goto("/#/users");
      await expect(
        page.getByRole("heading", { name: "Users list" }),
      ).toBeVisible();
      await page.waitForLoadState("networkidle");

      expect(await pageOverflow(page)).toBe(0);
    });
  });
}
