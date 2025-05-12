export const AppConfig = {
  VERSION: "1.24.10.29.01",
  ADMIN_API_URL: process.env.REACT_APP_ADMIN_API_URL || "",
  ADMIN_WS_URL: process.env.REACT_APP_ADMIN_WS_URL || "",
  LANGUAGES_API_URL: process.env.REACT_APP_LANGUAGES_API_URL || "",
  PROJECTS_API_URL: process.env.REACT_APP_PROJECTS_API_URL || "",
  GOOGLE: {
    CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || "",
    REDIRECT_URI: process.env.REACT_APP_GOOGLE_REDIRECT_URI || "",
  },
  LOGIN_URL: process.env.REACT_APP_LOGIN_URL || "",
  HOME_PAGE: process.env.REACT_APP_HOME_PAGE || "",
};
