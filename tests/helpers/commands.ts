import type { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  const context = page.context();
  const requestContext = context.request;
  const response = await requestContext.post("http://localhost:4000/auth/sign-in", {
    data: { email, password }
  });
  if (!response.ok()) {
    throw new Error(`Login API failed with status ${response.status()}`);
  }
  // The sign-in sets the session cookie in the context the page shares;
  // its body carries no token
  await page.goto("/variamos_admin/");
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
