// cspell:ignore gstatic
import { test as base, expect } from "@playwright/test";

// Fonts load once and shape the text the responsive tests measure
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

const EMPTY_BODY_TYPES: Record<string, string> = {
  document: "text/html",
  script: "text/javascript",
  stylesheet: "text/css",
};

/**
 * The test of the mocked suite: a request that leaves the application,
 * fonts aside, gets an empty answer. The sign in screen embeds a Google
 * Drive video and the Google Sign-In button, which kept the network busy,
 * so that the wait for a settled page timed out on Edge in CI. No mocked
 * test uses them.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(
      (url) =>
        url.hostname !== "localhost" && !FONT_HOSTS.includes(url.hostname),
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
