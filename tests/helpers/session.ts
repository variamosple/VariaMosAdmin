import type { Page } from "@playwright/test";

/** A JSON answer for page.route */
export const json = (data: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(data),
});

/** The account signed in by default in the mocked tests */
export const ADMIN = {
  id: "admin1",
  user: "admin",
  name: "Admin User",
  email: "admin@example.com",
  roles: ["Admin"],
};

/**
 * Answers the session check with a signed-in account that holds these
 * permissions; `user` changes the other fields of the account.
 */
export const mockSignedIn = (
  page: Page,
  permissions: string[],
  user: Partial<typeof ADMIN> = {},
) =>
  page.route("**/auth/session-info", (route) =>
    route.fulfill(json({ data: { user: { ...ADMIN, ...user, permissions } } })),
  );

/** Answers the session check as when no one is signed in */
export const mockSignedOut = (page: Page) =>
  page.route("**/auth/session-info", (route) =>
    route.fulfill(
      json(
        {
          errorCode: 401,
          message: "Your session has expired, please log in again.",
        },
        401,
      ),
    ),
  );
