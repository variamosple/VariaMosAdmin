export const AppConfig = {
  VERSION: "1.24.10.29.01",
  ADMIN_API_URL: import.meta.env.VITE_ADMIN_API_URL || "",
  ADMIN_WS_URL: import.meta.env.VITE_ADMIN_WS_URL || "",
  LANGUAGES_API_URL: import.meta.env.VITE_LANGUAGES_API_URL || "",
  PROJECTS_API_URL: import.meta.env.VITE_PROJECTS_API_URL || "",
  GOOGLE: {
    CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
    REDIRECT_URI: import.meta.env.VITE_GOOGLE_REDIRECT_URI || "",
  },
  LOGIN_URL: import.meta.env.VITE_LOGIN_URL || "",
  HOME_PAGE: import.meta.env.VITE_HOME_PAGE || "",
};
