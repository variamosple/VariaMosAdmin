import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { requestSignIn } from "./AuthRepository";
import {
  confirmMfaEnrollment,
  disableMfa,
  getMfaStatus,
  requestSignInMfa,
  startMfaEnrollment,
} from "./MfaRepository";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("MfaRepository", () => {
  it("reads the status", async () => {
    const response = await getMfaStatus();

    expect(response.data).toEqual({
      available: true,
      enabled: false,
      recoveryCodesRemaining: 0,
    });
  });

  it("sends the password, then the code, then both to turn off", async () => {
    const bodies: Record<string, string>[] = [];
    const record =
      (data: object) =>
      async ({ request }: { request: Request }) => {
        bodies.push((await request.json()) as Record<string, string>);
        return HttpResponse.json({ data });
      };
    server.use(
      http.post(
        apiTarget("/auth/mfa/enrollment"),
        record({ otpauthUri: "otpauth://totp/x", secret: "ABC" }),
      ),
      http.post(
        apiTarget("/auth/mfa/enrollment/confirm"),
        record({ recoveryCodes: ["aaaaa-bbbbb"] }),
      ),
      http.post(apiTarget("/auth/mfa/disable"), record({})),
    );

    expect((await startMfaEnrollment("pass")).data?.secret).toBe("ABC");
    expect((await confirmMfaEnrollment("123456")).data?.recoveryCodes).toEqual([
      "aaaaa-bbbbb",
    ]);
    await disableMfa("pass", "654321");

    expect(bodies).toEqual([
      { password: "pass" },
      { code: "123456" },
      { password: "pass", code: "654321" },
    ]);
  });

  it("gives the error of the server", async () => {
    server.use(
      http.post(apiTarget("/auth/sign-in/mfa"), () =>
        HttpResponse.json(
          { errorCode: "INVALID_INPUT", message: "The code is incorrect." },
          { status: 400 },
        ),
      ),
    );

    const response = await requestSignInMfa("000000");

    expect(response.errorCode).toBe("INVALID_INPUT");
    expect(response.message).toBe("The code is incorrect.");
  });
});

describe("requestSignIn", () => {
  it("marks a sign-in that waits for the code, so no session is asked", async () => {
    server.use(
      http.post(apiTarget("/auth/sign-in"), () =>
        HttpResponse.json({ data: { mfaRequired: true } }),
      ),
    );

    const response = await requestSignIn({ email: "a@b.c", password: "x" });

    expect(response.errorCode).toBe(428);
    expect(response.data?.mfaRequired).toBe(true);
  });

  it("leaves a normal sign-in as it is", async () => {
    server.use(
      http.post(apiTarget("/auth/sign-in"), () =>
        HttpResponse.json({ data: { redirect: "http://home" } }),
      ),
    );

    const response = await requestSignIn({ email: "a@b.c", password: "x" });

    expect(response.errorCode).toBeFalsy();
    expect(response.data?.redirect).toBe("http://home");
  });
});
