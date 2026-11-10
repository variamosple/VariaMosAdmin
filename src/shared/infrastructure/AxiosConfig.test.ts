import axios from "axios";
import { HttpResponse, http } from "msw";
import { server } from "../tests/mocks/server";
import { ADMIN_CLIENT, setupAxiosInterceptors } from "./AxiosConfig";

describe("AxiosConfig Interceptors", () => {
  let navigateMock: import("vitest").Mock;
  let testClient: import("axios").AxiosInstance;

  beforeEach(() => {
    navigateMock = vi.fn();
    testClient = axios.create({
      baseURL: "http://api.test",
    });

    // Setup the response interceptor we want to test
    setupAxiosInterceptors(testClient, navigateMock);

    localStorage.clear();
    window.location.hash = "";
  });

  it("should add Authorization header if token exists in localStorage", async () => {
    localStorage.setItem("authToken", "test-token");
    server.use(
      http.get("*/data-auth-check", () => {
        return HttpResponse.json({ ok: true });
      }),
    );

    const response = await ADMIN_CLIENT.get("/data-auth-check");
    expect(response.config.headers.Authorization).toBe("Bearer test-token");
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

  it("should navigate to login on 401 error if route is not public and hash is empty", async () => {
    // window.location.hash is empty ("") from beforeEach
    server.use(
      http.get("http://api.test/secure", () => {
        return new HttpResponse(JSON.stringify({}), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    await expect(testClient.get("/secure")).rejects.toThrow();
    expect(navigateMock).toHaveBeenCalledWith(
      `/login?reason=session-expired&redirectTo=${encodeURIComponent(window.location.href)}`,
    );
  });

  it("should navigate to login with a reason, not the server message, on 401", async () => {
    window.location.hash = "#/dashboard";
    server.use(
      http.get("http://api.test/secure", () => {
        return new HttpResponse(JSON.stringify({ message: "Token expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    await expect(testClient.get("/secure")).rejects.toThrow();
    // The server text is not put in the address, the current page is
    const target = navigateMock.mock.calls[0][0] as string;
    expect(target).not.toContain("Token expired");
    const params = new URLSearchParams(target.split("?")[1]);
    expect(params.get("reason")).toBe("session-expired");
    expect(params.get("redirectTo")).toMatch(/#\/dashboard$/);
  });

  it("should not navigate to login on 401 error if route is public", async () => {
    window.location.hash = "#/login";
    server.use(
      http.get("http://api.test/public-endpoint", () => {
        return new HttpResponse(
          JSON.stringify({ message: "Invalid credentials" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }),
    );

    await expect(testClient.get("/public-endpoint")).rejects.toThrow();
    expect(navigateMock).not.toHaveBeenCalled();
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
    expect(navigateMock).toHaveBeenCalledOnce();

    navigateMock.mockClear();
    window.location.hash = "#/reset-password?token=abc";
    await expect(testClient.get("/secure")).rejects.toThrow();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("should not navigate to login on other errors", async () => {
    window.location.hash = "#/dashboard";
    server.use(
      http.get("http://api.test/error-500", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(testClient.get("/error-500")).rejects.toThrow();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
