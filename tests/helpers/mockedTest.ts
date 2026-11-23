import { test as base, expect } from "@playwright/test";

const EMPTY_BODY_TYPES: Record<string, string> = {
  document: "text/html",
  script: "text/javascript",
  stylesheet: "text/css",
};

/**
 * The test of the mocked suite: a request that leaves the application gets
 * an empty answer; the fonts are served with it (ADM-N45). The sign in
 * screen embeds a Google Drive video and the Google Sign-In button, which
 * kept the network busy, so that the wait for a settled page timed out on
 * Edge in CI. No mocked test uses them.
 */
export const test = base.extend<object, { warmBrowser: undefined }>({
  // The first page of a browser just installed on the CI runner took 17 s
  // to open under Edge, within the 20 s of the first test, which then timed
  // out. It opens here once per worker, with its own time limit.
  warmBrowser: [
    async ({ browser }, use) => {
      const page = await browser.newPage();
      await page.close();
      await use(undefined);
    },
    { scope: "worker", auto: true, timeout: 60_000 },
  ],
  context: async ({ context }, use) => {
    await context.route(
      (url) => url.hostname !== "localhost",
      (route) =>
        route.fulfill({
          contentType: EMPTY_BODY_TYPES[route.request().resourceType()],
          body: "",
        }),
    );
    await use(context);
  },
});

export { expect };
