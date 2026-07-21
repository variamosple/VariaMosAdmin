import axios from "axios";
import { setupAxiosInterceptors, ADMIN_CLIENT } from "./AxiosConfig";
import { server } from "../tests/mocks/server";
import { http, HttpResponse } from "msw";

describe("AxiosConfig Interceptors", () => {
  let navigateMock: jest.Mock;
  let testClient: any;

  beforeEach(() => {
    navigateMock = jest.fn();
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
    expect(navigateMock).toHaveBeenCalledWith("/login?errorMessage=");
  });

  it("should navigate to login with message on 401 error if route is not public", async () => {
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
    expect(navigateMock).toHaveBeenCalledWith("/login?errorMessage=Token expired");
  });

  it("should not navigate to login on 401 error if route is public", async () => {
    window.location.hash = "#/login";
    server.use(
      http.get("http://api.test/public-endpoint", () => {
        return new HttpResponse(JSON.stringify({ message: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    await expect(testClient.get("/public-endpoint")).rejects.toThrow();
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
