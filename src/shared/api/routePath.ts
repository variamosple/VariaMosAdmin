// Pages a signed-out visitor may stay on: a 401 there is about the form
// (a wrong password, an expired link), not about a session
const PUBLIC_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
  "/sign-up",
]);

/** The path of the hash route, without its query: "#/login?x=1" gives "/login". */
export const currentRoutePath = () => {
  const [path = ""] = window.location.hash.replace(/^#/, "").split("?");
  return path;
};

/** Whether the page shown is one a signed-out visitor may stay on. */
export const isPublicRoute = () => PUBLIC_PATHS.has(currentRoutePath());
