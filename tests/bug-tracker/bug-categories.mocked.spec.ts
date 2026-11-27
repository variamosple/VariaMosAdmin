import type { Page } from "@playwright/test";
import { expect, test } from "../helpers/mockedTest";
import { ADMIN, json, mockSignedIn } from "../helpers/session";

// EV-41 (variamos-components 0.14.0, ADR-0083): the global bug form reads
// its categories on the public GET /bugs/categories of the admin when it is
// first opened. The fixed list shows at once and stays when the admin does
// not answer.

const openBugForm = async (page: Page) => {
  await page.route("**/v1/configurations/menu", (route) =>
    route.fulfill(
      json({
        data: {
          items: [],
          subMenu: [],
          options: [{ title: "Report a problem", location: "#report-bug" }],
        },
      }),
    ),
  );
  await page.goto("http://localhost:3000/#/");
  await page.getByRole("button", { name: ADMIN.name }).click();
  await page.getByRole("button", { name: "Report a problem" }).click();
  return page.getByRole("dialog", { name: "Report a New Bug" });
};

const categoryNames = (page: Page) =>
  page
    .getByRole("dialog", { name: "Report a New Bug" })
    .getByLabel("Category")
    .locator("option")
    .allTextContents();

test.describe("Bug form - categories of the admin (mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedIn(page, []);
  });

  test("shows the categories the admin accepts, without losing the input", async ({
    page,
  }) => {
    let answer = () => {};
    const answered = new Promise<void>((resolve) => {
      answer = resolve;
    });
    await page.route("**/bugs/categories", async (route) => {
      // Held until the title is typed: the list arrives with the form open
      await answered;
      await route.fulfill(
        json({ transactionId: "categories", data: ["Editor", "Wiki"] }),
      );
    });

    const bugForm = await openBugForm(page);
    await bugForm.getByLabel("Title *").fill("Half a report");
    answer();

    await expect.poll(() => categoryNames(page)).toEqual(["Editor", "Wiki"]);
    await expect(bugForm.getByLabel("Title *")).toHaveValue("Half a report");
  });

  test("keeps the fixed list when the admin does not answer", async ({
    page,
  }) => {
    await page.route("**/bugs/categories", (route) =>
      route.fulfill(json({ message: "down" }, 503)),
    );

    await openBugForm(page);

    await expect
      .poll(() => categoryNames(page))
      .toEqual([
        "Editor",
        "Model",
        "Language",
        "Project",
        "Simulation",
        "Account/Security",
        "Other",
      ]);
  });
});
