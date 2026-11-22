import { expect, type Page, test } from "@playwright/test";
import dbHelper from "../helpers/adminDbHelper.js";
import { login } from "../helpers/commands.js";

const ADMIN_API = "http://localhost:4000";
// A service no other test uses, so that stopping it disturbs none
const SERVICE = "vms_domain_application";
const SERVICE_NAME = "Domain Application";
// The page reads the list again every 30 s (MA-MS-01), plus the answer
const REFRESH_MS = 30_000 + 10_000;
// A start or a restart is followed until the service answers (EV-86 lot 3)
const BACK_UP_MS = 90_000;

// EV-86, MA-MS-01 and MA-MS-03 on the real services: a service that goes
// down is shown down by the open page, and a start or a restart is followed
// until the service answers again
test.describe("Monitoring - Service down and restart", () => {
  test.describe.configure({ mode: "serial" });
  const suffix = Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);
  const adminEmail = `admin-${suffix}@variamos-test.com`;
  const adminPassword = "Password123!";

  test.beforeAll(async () => {
    await dbHelper.seedTestUsers(suffix);
  });

  test.afterAll(async ({ playwright }) => {
    // Whatever happened above, the service is left running
    const request = await playwright.request.newContext();
    await request.post(`${ADMIN_API}/auth/sign-in`, {
      data: { email: adminEmail, password: adminPassword },
    });
    await request.put(`${ADMIN_API}/v1/micro-services/${SERVICE}/start`);
    await request.dispose();
    await dbHelper.cleanTestUsers(suffix);
  });

  const statusOf = (page: Page) =>
    page.locator("tr", { hasText: SERVICE_NAME }).locator("td").nth(1);

  const confirm = async (page: Page, verb: string) => {
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(`${verb} ${SERVICE_NAME}?`);
    await dialog.getByRole("button", { name: `${verb} microservice` }).click();
  };

  test("shows a service that goes down, then follows its start and its restart", async ({
    page,
  }) => {
    test.setTimeout(6 * 60_000);
    await login(page, adminEmail, adminPassword);

    // The collector records a first check after the stack starts
    await expect
      .poll(
        async () => {
          const res = await page.request.get(
            `${ADMIN_API}/v1/micro-services?page=1&limit=20`,
          );
          const body = await res.json();
          return body.data?.find(
            (s: { displayName: string }) => s.displayName === SERVICE_NAME,
          )?.health?.status;
        },
        { timeout: 120_000, intervals: [3_000] },
      )
      .toBe("UP");

    await page.getByRole("button", { name: "Monitoring" }).first().click();
    await expect(page).toHaveURL(/.*monitoring.*/);
    await expect(statusOf(page)).toHaveText(/^UP$/i, { timeout: 30_000 });

    // The service goes down while the page is open, outside of it
    const stopped = await page.request.put(
      `${ADMIN_API}/v1/micro-services/${SERVICE}/stop`,
    );
    expect(stopped.ok()).toBe(true);
    await expect(statusOf(page)).toHaveText(/^DOWN$/i, {
      timeout: REFRESH_MS,
    });
    const row = page.locator("tr", { hasText: SERVICE_NAME });
    await expect(row.locator('button[title="Start Service"]')).toBeVisible();

    // Start: followed until the service answers again
    await row.locator('button[title="Start Service"]').click();
    await confirm(page, "Start");
    await expect(statusOf(page)).toHaveText(/STARTING/i);
    await expect(statusOf(page)).toHaveText(/^UP$/i, { timeout: BACK_UP_MS });

    // Restart: the same, with its own step
    await row.locator('button[title="Restart Service"]').click();
    await confirm(page, "Restart");
    await expect(statusOf(page)).toHaveText(/RESTARTING/i);
    await expect(statusOf(page)).toHaveText(/^UP$/i, { timeout: BACK_UP_MS });
    await expect(row.locator('button[title="Stop Service"]')).toBeVisible();
  });
});
