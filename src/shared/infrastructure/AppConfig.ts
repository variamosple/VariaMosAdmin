// The container writes config.js at start-up from its VITE_* variables
// (etc/runtime-config.sh): the same image serves production and the
// development kit. It lists every value, the ones it was not given with
// their value of the build. A page served without the container (vite,
// tests) has an empty config.js and keeps the values of the build.
declare global {
  var __VARIAMOS_CONFIG__: Record<string, string | undefined> | undefined;
}

const runtime = globalThis.__VARIAMOS_CONFIG__ ?? {};

// An empty value written at start-up stays empty: the kit turns Google
// sign-in off this way
const setting = (name: string, built: string | undefined) =>
  runtime[name] ?? built ?? "";

export const AppConfig = {
  ADMIN_API_URL: setting(
    "VITE_ADMIN_API_URL",
    import.meta.env.VITE_ADMIN_API_URL,
  ),
  ADMIN_WS_URL: setting("VITE_ADMIN_WS_URL", import.meta.env.VITE_ADMIN_WS_URL),
  LANGUAGES_API_URL: setting(
    "VITE_LANGUAGES_API_URL",
    import.meta.env.VITE_LANGUAGES_API_URL,
  ),
  PROJECTS_API_URL: setting(
    "VITE_PROJECTS_API_URL",
    import.meta.env.VITE_PROJECTS_API_URL,
  ),
  GOOGLE: {
    CLIENT_ID: setting(
      "VITE_GOOGLE_CLIENT_ID",
      import.meta.env.VITE_GOOGLE_CLIENT_ID,
    ),
    REDIRECT_URI: setting(
      "VITE_GOOGLE_REDIRECT_URI",
      import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    ),
  },
  LOGIN_URL: setting("VITE_LOGIN_URL", import.meta.env.VITE_LOGIN_URL),
  HOME_PAGE: setting("VITE_HOME_PAGE", import.meta.env.VITE_HOME_PAGE),
  NOTIFICATION_API_URL: setting(
    "VITE_NOTIFICATION_API_URL",
    import.meta.env.VITE_NOTIFICATION_API_URL || "http://localhost:3005",
  ),
};
