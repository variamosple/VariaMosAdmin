import axios from "axios";
import { HttpResponse, http } from "msw";
import { server } from "../tests/mocks/server";
import { ADMIN_CLIENT, setupAxiosInterceptors } from "./AxiosConfig";

describe("AxiosConfig Interceptors", () => {
  let checkSession: import("vitest").Mock;
  let testClient: import("axios").AxiosInstance;

  beforeEach(() => {
    checkSession = vi.fn();
    testClient = axios.create({
      baseURL: "http://api.test",
    });

    // Setup the response interceptor we want to test
    setupAxiosInterceptors(testClient, checkSession);

    localStorage.clear();
    window.location.hash = "";
  });

  it("never sends a token kept in localStorage: the cookie carries the session", async () => {
    localStorage.setItem("authToken", "stale-token");
    server.use(
      http.get("*/data-auth-check", () => {
        return HttpResponse.json({ ok: true });
      }),
    );

    const response = await ADMIN_CLIENT.get("/data-auth-check");
    expect(response.config.headers.Authorization).toBeUndefined();
    expect(response.config.withCredentials).toBe(true);
  });

  it("should not add Authorization header if token is absent", async () => {
    server.use(
      http.get("*/data-auth-check", () => {
        return HttpResponse.json({ ok: true });
      }),
    );

    const response = await ADMIN_CLIENT.get("/data-auth-check");
    expect(response.config.headers.Authorization).toBeUndefined();
  });

  it("should return response directly on success", async () => {
    server.use(
      http.get("http://api.test/data", () => {
        return HttpResponse.json({ testData: "yes" });
      }),
    );

    const res = await testClient.get("/data");
    expect(res.data).toEqual({ testData: "yes" });
  });

  it("checks the session on a 401 of a private page, and sends nowhere itself", async () => {
    // window.location.hash is empty ("") from beforeEach: the home page
    server.use(
      http.get("http://api.test/secure", () =>
        HttpResponse.json({ message: "Token expired" }, { status: 401 }),
      ),
    );

    await expect(testClient.get("/secure")).rejects.toThrow();
    // The admin renews a token expired during a restart, or says that the
    // session is over: the session watcher then decides
    expect(checkSession).toHaveBeenCalledOnce();
  });

  it("leaves the 401 of a public page to its form", async () => {
    window.location.hash = "#/login";
    server.use(
      http.get("http://api.test/public-endpoint", () =>
        HttpResponse.json({ message: "Invalid credentials" }, { status: 401 }),
      ),
    );

    await expect(testClient.get("/public-endpoint")).rejects.toThrow();
    expect(checkSession).not.toHaveBeenCalled();
  });

  it("treats only the listed sign-in pages as public", async () => {
    // A private page whose address merely contains "/login"
    window.location.hash = "#/users/login-history";
    server.use(
      http.get("http://api.test/secure", () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );

    await expect(testClient.get("/secure")).rejects.toThrow();
    expect(checkSession).toHaveBeenCalledOnce();

    checkSession.mockClear();
    window.location.hash = "#/reset-password?token=abc";
    await expect(testClient.get("/secure")).rejects.toThrow();
    expect(checkSession).not.toHaveBeenCalled();
  });

  it("checks the session on a 401 of another service", async () => {
    window.location.hash = "#/projects";
    const projects = axios.create({ baseURL: "http://projects.test" });
    setupAxiosInterceptors(projects, checkSession);
    server.use(
      http.post("http://projects.test/projects", () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );

    await expect(projects.post("/projects")).rejects.toThrow();
    expect(checkSession).toHaveBeenCalledOnce();
  });

  it("leaves the 401 of the session check to the session watcher", async () => {
    window.location.hash = "#/roles";
    server.use(
      http.get("http://api.test/auth/session-info", () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );

    await expect(testClient.get("/auth/session-info")).rejects.toThrow();
    expect(checkSession).not.toHaveBeenCalled();
  });

  it("checks nothing on other errors", async () => {
    window.location.hash = "#/dashboard";
    server.use(
      http.get("http://api.test/error-500", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(testClient.get("/error-500")).rejects.toThrow();
    expect(checkSession).not.toHaveBeenCalled();
  });
});
