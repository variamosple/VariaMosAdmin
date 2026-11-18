describe("AppConfig", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("prefers the addresses written by the container at start-up", async () => {
    vi.stubGlobal("__VARIAMOS_CONFIG__", {
      VITE_ADMIN_API_URL: "http://localhost:8090/variamos_ms_admin",
      VITE_GOOGLE_CLIENT_ID: "",
    });
    vi.stubEnv("VITE_ADMIN_API_URL", "https://build.example/variamos_ms_admin");
    vi.stubEnv("VITE_HOME_PAGE", "https://build.example/");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client.example");

    const { AppConfig } = await import("./AppConfig");

    expect(AppConfig.ADMIN_API_URL).toBe(
      "http://localhost:8090/variamos_ms_admin",
    );
    // Not written at start-up: the value of the build
    expect(AppConfig.HOME_PAGE).toBe("https://build.example/");
    // Written empty at start-up: empty
    expect(AppConfig.GOOGLE.CLIENT_ID).toBe("");
  });

  it("keeps the values of the build without config.js", async () => {
    vi.stubEnv("VITE_LOGIN_URL", "https://build.example/#/login");
    vi.stubEnv("VITE_NOTIFICATION_API_URL", "");

    const { AppConfig } = await import("./AppConfig");

    expect(AppConfig.LOGIN_URL).toBe("https://build.example/#/login");
    expect(AppConfig.NOTIFICATION_API_URL).toBe("http://localhost:3005");
  });
});
