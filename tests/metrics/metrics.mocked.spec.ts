import { expect, test } from "../helpers/mockedTest";
import { mockSignedIn } from "../helpers/session";

// The statistics page for one period (EV-90): key figures, charts over time
// and rankings, read in one request
const day = (offset: number) => {
  const date = new Date(Date.UTC(2026, 9, 1 + offset));
  return date.toISOString().slice(0, 10);
};
const overTime = (series: string[], value: (s: number, d: number) => number) =>
  Array.from({ length: 30 }, (_, d) =>
    series.map((name, s) => ({
      series: name,
      count: value(s, d),
      date: day(d),
    })),
  ).flat();

const PAGES: [string, number][] = [
  ["UserLanguageList", 963],
  ["EditLanguage", 866],
  ["AllLanguageList", 615],
  ["PublicLanguageList", 411],
  ["UserList", 177],
  ["CreateLanguage", 107],
  ["AdminBugList", 81],
  ["Monitoring", 80],
  ["Metrics", 56],
  ["SharedExperimentsList", 2],
];

const metrics = [
  {
    id: "overview",
    title: "Overview",
    chartType: "kpi",
    defaultFilter: "key",
    data: [
      {
        key: "visits",
        label: "Visits",
        unit: "count",
        count: 412,
        previous: 350,
      },
      {
        key: "visitors",
        label: "Visitors",
        unit: "count",
        count: 38,
        previous: 41,
      },
      {
        key: "active_users",
        label: "Active users",
        unit: "count",
        count: 52,
        previous: 47,
      },
      {
        key: "returning_users",
        label: "Returning users",
        unit: "percent",
        count: 61,
        previous: 58,
      },
      {
        key: "active_projects",
        label: "Active projects",
        unit: "count",
        count: 27,
        previous: 30,
      },
      {
        key: "new_accounts",
        label: "New accounts",
        unit: "count",
        count: 9,
        previous: 4,
      },
      {
        key: "sign_ins",
        label: "Sign-ins",
        unit: "count",
        count: 140,
        previous: 120,
      },
      {
        key: "failed_sign_ins",
        label: "Failed sign-ins",
        unit: "count",
        count: 12,
        previous: 6,
      },
    ],
  },
  {
    id: "content_overview",
    title: "On the platform today",
    chartType: "kpi",
    defaultFilter: "key",
    data: [
      { key: "accounts", label: "Accounts", unit: "count", count: 243 },
      { key: "projects", label: "Projects", unit: "count", count: 671 },
      {
        key: "collaborative_projects",
        label: "Collaborative projects",
        unit: "percent",
        count: 82,
      },
      { key: "models", label: "Models", unit: "count", count: 668 },
      {
        key: "models_per_project",
        label: "Models per project",
        unit: "decimal",
        count: 1,
      },
      {
        key: "languages_in_use",
        label: "Languages in use",
        unit: "count",
        count: 30,
      },
    ],
  },
  {
    id: "visits_over_time",
    title: "Visits and visitors",
    chartType: "line",
    defaultFilter: "series",
    labelKey: "date",
    data: overTime(["Visits", "Visitors"], (s, d) =>
      s === 0 ? 8 + ((d * 7) % 13) : 2 + ((d * 3) % 5),
    ),
  },
  {
    id: "activity_over_time",
    title: "Active users and projects",
    chartType: "line",
    defaultFilter: "series",
    labelKey: "date",
    data: overTime(["Active users", "Active projects"], (s, d) =>
      s === 0 ? 3 + ((d * 5) % 7) : 1 + ((d * 2) % 4),
    ),
  },
  {
    id: "top_visited_pages",
    title: "Most visited pages",
    chartType: "ranking",
    defaultFilter: "page",
    labelKey: "page",
    data: PAGES.map(([page, count]) => ({ page, count })),
  },
  {
    id: "top_languages",
    title: "Most used languages (active projects)",
    chartType: "ranking",
    defaultFilter: "language",
    labelKey: "language",
    data: [
      { language: "Feature model", count: 14 },
      { language: "Class diagram", count: 6 },
      { language: "Goal model", count: 3 },
    ],
  },
  {
    id: "sign_ins",
    title: "Sign-ins",
    chartType: "bar",
    defaultFilter: "series",
    labelKey: "date",
    data: overTime(["Password", "Google", "Failed"], (s, d) =>
      s === 2 ? d % 3 : 2 + ((d + s) % 4),
    ),
  },
  {
    id: "new_accounts",
    title: "New accounts",
    chartType: "bar",
    defaultFilter: "series",
    labelKey: "date",
    data: overTime(["New accounts"], (_, d) => (d % 4 === 0 ? 1 : 0)),
  },
  {
    id: "models_by_type",
    title: "Models by type",
    chartType: "ranking",
    defaultFilter: "type",
    labelKey: "type",
    data: [
      { type: "Domain engineering", count: 640 },
      { type: "Scope", count: 26 },
      { type: "Application engineering", count: 2 },
    ],
  },
  {
    id: "yearly_visits",
    title: "Yearly visits",
    chartType: "geo",
    defaultFilter: "2026",
    labelKey: "Country",
    data: {
      "2026": [
        ["CO", 120],
        ["FR", 80],
      ],
    },
  },
];

test.describe("Metrics - Mocked E2E Flows", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await mockSignedIn(page, ["metrics::query"]);
  });

  test("shows the key figures and charts of one period, and reads the page again for another", async ({
    page,
  }) => {
    const asked: URLSearchParams[] = [];
    await page.route(/\/v1\/metrics(\?|$)/, async (route) => {
      asked.push(new URL(route.request().url()).searchParams);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: metrics }),
      });
    });

    await page.goto("http://localhost:3000/#/metrics");

    await expect(page.locator("h1").first()).toHaveText("Metrics");
    await expect(page.getByTestId("figure-visits")).toContainText("412");
    await expect(page.getByTestId("figure-visits")).toContainText(
      "+18 % vs previous period",
    );
    for (const title of [
      "Visits and visitors",
      "Active users and projects",
      "Most visited pages",
      "Most used languages (active projects)",
      "Sign-ins",
      "New accounts",
      "Models by type",
    ]) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
    // Pages under a readable name
    await expect(page.getByText("My languages")).toBeVisible();
    expect(asked[0]?.get("startDate")).toBeTruthy();

    const reread = page.waitForRequest(/\/v1\/metrics\?/);
    await page.getByRole("button", { name: "3 months" }).click();
    await reread;
    await expect(
      page.getByRole("button", { name: "3 months" }),
    ).toHaveAttribute("aria-pressed", "true");

    // A month chosen by hand (MA-EU-01)
    await page.getByRole("button", { name: "Custom…" }).click();
    await page.getByRole("combobox", { name: "Period" }).selectOption("month");
    await page.getByLabel("Month").fill("2026-09");
    const month = page.waitForRequest(/startDate=2026-09-01/);
    await page.getByRole("button", { name: "Apply" }).click();
    expect(new URL((await month).url()).searchParams.get("endDate")).toBe(
      "2026-09-30",
    );
    await expect(
      page.getByText("1 Sept 2026 – 30 Sept 2026, by day"),
    ).toBeVisible();
  });
});
