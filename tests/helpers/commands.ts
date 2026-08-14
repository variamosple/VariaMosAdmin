import { expect, type Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  const context = page.context();
  const requestContext = context.request;
  const response = await requestContext.post("http://localhost:4000/auth/sign-in", {
    data: { email, password }
  });
  if (!response.ok()) {
    throw new Error(`Login API failed with status ${response.status()}`);
  }
  const body = await response.json();
  const token = body.data.authToken;
  
  await page.goto("/variamos_admin/");
  await page.evaluate((t) => {
    window.localStorage.setItem("authToken", t);
  }, token);
  await page.reload();
}

export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/variamos_admin/#/login");
  await page.getByTestId("login-email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/auth/sign-in") && res.status() === 200),
    page.locator('button[type="submit"]').click(),
  ]);
  await expect(page).not.toHaveURL(/.*\/login/);
}

export async function disconnect(page: Page) {
  if (page.url() === "about:blank" || !page.url().startsWith("http")) {
    await page.goto("/variamos_admin/");
  }

  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.context().clearCookies();

  await page.goto("about:blank");
}
