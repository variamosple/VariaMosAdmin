import type { Page } from "@playwright/test";
import { expect, test } from "../helpers/mockedTest";
import { json, mockSignedIn } from "../helpers/session";

// EV-96: a page that holds input asks before it is left, by a change of
// route, the back button or the closing of the tab. A 401 says that the
// session is being confirmed and keeps the input (ADM-N09, TRV-65).

const ROLE_PAGE = "http://localhost:3000/#/roles/10";

const paged = <T>(data: T[]) =>
  json({ data, totalItems: data.length, totalPages: 1, currentPage: 1 });

const mockRolePage = async (page: Page) => {
  await mockSignedIn(page, [
    "roles::query",
    "roles::update",
    "permissions::query",
  ]);
  await page.route("**/v1/permissions*", (route) =>
    route.fulfill(paged([{ id: 101, name: "bugs::query" }])),
  );
  await page.route("**/v1/roles?*", (route) =>
    route.fulfill(paged([{ id: 10, name: "Reviewers" }])),
  );
  await page.route("**/v1/roles/10/permissions*", (route) =>
    route.fulfill(paged([])),
  );
  await page.route("**/v1/roles/10", (route) =>
    route.fulfill(json({ data: { id: 10, name: "Reviewers" } })),
  );
};

/** Chooses a permission to add, without adding it yet. */
const choosePermission = async (page: Page) => {
  await page.getByPlaceholder("Select a permission").click();
  await page.getByRole("button", { name: "bugs::query" }).click();
  await expect(page.getByPlaceholder("Select a permission")).toHaveAttribute(
    "title",
    "bugs::query",
  );
};

const askedToLeave = (page: Page) =>
  page.getByRole("dialog", { name: /^Discard your input\?/ });

test.describe("Leaving a page that holds input (EV-96)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("asks before a change of route leaves the page", async ({ page }) => {
    await mockRolePage(page);
    await page.goto(ROLE_PAGE);
    await choosePermission(page);
    const backToList = page.getByRole("button", { name: "Back to role list" });

    await backToList.click();
    await expect(askedToLeave(page)).toBeVisible();
    await askedToLeave(page)
      .getByRole("button", { name: "Keep editing" })
      .click();
    await expect(page).toHaveURL(/#\/roles\/10$/);
    await expect(page.getByPlaceholder("Select a permission")).toHaveAttribute(
      "title",
      "bugs::query",
    );

    await backToList.click();
    await askedToLeave(page).getByRole("button", { name: "Discard" }).click();
    await expect(page).toHaveURL(/#\/roles$/);
  });

  test("asks before the back and forward buttons leave the page", async ({
    page,
  }) => {
    await mockRolePage(page);
    // Pages reached in the application, as by a user
    await page.goto(ROLE_PAGE);
    await page.getByRole("button", { name: "Back to role list" }).click();
    await expect(page).toHaveURL(/#\/roles$/);
    await page.goBack();
    await expect(page).toHaveURL(/#\/roles\/10$/);
    await choosePermission(page);

    await page.goForward();
    await expect(askedToLeave(page)).toBeVisible();
    await askedToLeave(page)
      .getByRole("button", { name: "Keep editing" })
      .click();
    await expect(page).toHaveURL(/#\/roles\/10$/);
    await expect(page.getByPlaceholder("Select a permission")).toHaveAttribute(
      "title",
      "bugs::query",
    );
  });

  test("asks the browser before the tab is closed", async ({ page }) => {
    await mockRolePage(page);
    await page.goto(ROLE_PAGE);
    await choosePermission(page);

    const dialog = page.waitForEvent("dialog");
    await page.close({ runBeforeUnload: true });
    const asked = await dialog;
    expect(asked.type()).toBe("beforeunload");
    await asked.dismiss();
    expect(page.isClosed()).toBe(false);
  });

  test("says that the session is being confirmed on a 401, and keeps the choice", async ({
    page,
  }) => {
    await mockRolePage(page);
    // Refused once, as just after a restart of the admin
    await page.route("**/v1/roles/10/permissions", (route) =>
      route.request().method() === "POST"
        ? route.fulfill(json({ errorCode: 401, message: "Unauthorized" }, 401))
        : route.fulfill(paged([])),
    );
    await page.goto(ROLE_PAGE);
    await choosePermission(page);

    await page.getByRole("button", { name: "Add permission" }).click();
    await expect(
      page.getByText("Your session could not be confirmed."),
    ).toBeVisible();
    await expect(page.getByText("Unauthorized")).toBeHidden();
    await expect(page).toHaveURL(/#\/roles\/10$/);
    await expect(page.getByPlaceholder("Select a permission")).toHaveAttribute(
      "title",
      "bugs::query",
    );
  });
});
