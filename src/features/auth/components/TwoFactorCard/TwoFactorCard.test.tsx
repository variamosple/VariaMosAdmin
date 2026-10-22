// A base32 test secret
// cspell:ignore JBSWY DPEHPK
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { TwoFactorCard } from "./index";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const CODES = Array.from({ length: 10 }, (_, i) => `aaaa${i}-bbbbb`);

/** A server that turns the factor on and off, as the admin does. */
function mfaServer(initial: { available?: boolean; enabled?: boolean } = {}) {
  const state = {
    available: initial.available ?? true,
    enabled: initial.enabled ?? false,
  };
  const bodies: Record<string, string>[] = [];
  server.use(
    http.get(apiTarget("/auth/mfa"), () =>
      HttpResponse.json({
        data: {
          ...state,
          recoveryCodesRemaining: state.enabled ? 10 : 0,
        },
      }),
    ),
    http.post(apiTarget("/auth/mfa/enrollment"), async ({ request }) => {
      const body = (await request.json()) as Record<string, string>;
      bodies.push(body);
      if (body.password !== "Right-pass-1") {
        return HttpResponse.json(
          { errorCode: "INVALID_INPUT", message: "The password is incorrect." },
          { status: 400 },
        );
      }
      return HttpResponse.json({
        data: {
          otpauthUri: "otpauth://totp/VariaMos:ana%40example.com?secret=ABC",
          secret: "JBSWY3DPEHPK3PXP",
        },
      });
    }),
    http.post(
      apiTarget("/auth/mfa/enrollment/confirm"),
      async ({ request }) => {
        bodies.push((await request.json()) as Record<string, string>);
        state.enabled = true;
        return HttpResponse.json({ data: { recoveryCodes: CODES } });
      },
    ),
    http.post(apiTarget("/auth/mfa/disable"), async ({ request }) => {
      bodies.push((await request.json()) as Record<string, string>);
      state.enabled = false;
      return HttpResponse.json({ data: null });
    }),
  );
  return { state, bodies };
}

describe("TwoFactorCard", () => {
  it("turns the factor on: password, QR code, first code, recovery codes", async () => {
    const user = userEvent.setup();
    const { bodies } = mfaServer();
    render(<TwoFactorCard />);

    await user.click(await screen.findByRole("button", { name: "Turn on" }));
    await user.type(
      screen.getByLabelText("Confirm your password"),
      "Right-pass-1",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      await screen.findByTitle("QR code of the authenticator app"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("mfa-secret")).toHaveTextContent(
      "JBSWY3DPEHPK3PXP",
    );

    await user.type(screen.getByLabelText("Code from the app"), "123456");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Turn on",
      }),
    );

    const codes = await screen.findByTestId("recovery-codes");
    expect(within(codes).getAllByRole("listitem")).toHaveLength(10);
    expect(codes).toHaveTextContent("aaaa0-bbbbb");

    await user.click(screen.getByRole("button", { name: "I have saved them" }));

    expect(await screen.findByText("On")).toBeInTheDocument();
    expect(screen.getByText(/10 recovery code\(s\) left/)).toBeInTheDocument();
    expect(bodies).toEqual([{ password: "Right-pass-1" }, { code: "123456" }]);
  });

  it("shows the error of a wrong password and stays on the step", async () => {
    const user = userEvent.setup();
    mfaServer();
    render(<TwoFactorCard />);

    await user.click(await screen.findByRole("button", { name: "Turn on" }));
    await user.type(screen.getByLabelText("Confirm your password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      await screen.findByText("The password is incorrect."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm your password")).toBeInTheDocument();
  });

  it("turns the factor off with the password and a code", async () => {
    const user = userEvent.setup();
    const { bodies } = mfaServer({ enabled: true });
    render(<TwoFactorCard />);

    await user.click(await screen.findByRole("button", { name: "Turn off" }));
    await user.type(screen.getByLabelText("Password"), "Right-pass-1");
    await user.type(
      screen.getByLabelText("Code from the app, or a recovery code"),
      "aaaa3-bbbbb",
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Turn off",
      }),
    );

    await waitFor(() => expect(screen.getByText("Off")).toBeInTheDocument());
    expect(bodies).toEqual([{ password: "Right-pass-1", code: "aaaa3-bbbbb" }]);
  });

  it("says when the server cannot offer it yet", async () => {
    mfaServer({ available: false });
    render(<TwoFactorCard />);

    expect(
      await screen.findByText(
        "Two-factor authentication is not available yet.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Turn on" })).toBeNull();
  });

  it.each([
    ["a guest (FORBIDDEN)", "FORBIDDEN"],
    ["an account without my-account rights (403)", 403],
  ])("stays hidden for %s", async (_label, errorCode) => {
    server.use(
      http.get(apiTarget("/auth/mfa"), () =>
        HttpResponse.json({ errorCode, message: "no" }, { status: 403 }),
      ),
    );

    const { container } = render(<TwoFactorCard />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("says when the status cannot be read, and tries again", async () => {
    let calls = 0;
    server.use(
      http.get(apiTarget("/auth/mfa"), () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(
              { errorCode: "SYSTEM_ERROR", message: "Internal server error" },
              { status: 500 },
            )
          : HttpResponse.json({
              data: {
                available: true,
                enabled: false,
                recoveryCodesRemaining: 0,
              },
            });
      }),
    );
    render(<TwoFactorCard />);

    expect(
      await screen.findByText("Two-factor authentication could not be loaded."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).toBeNull();
    expect(screen.queryByText("Off")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("button", { name: "Turn on" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument();
  });

  it("asks for the code again on all browsers", async () => {
    mfaServer({ enabled: true });
    let forgotten = 0;
    server.use(
      http.delete(apiTarget("/auth/mfa/trusted-devices"), () => {
        forgotten += 1;
        return HttpResponse.json({ data: { removed: 2 } });
      }),
    );
    render(<TwoFactorCard />);

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Ask for the code again on all my browsers",
      }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Done: every browser will ask for the code again.",
    );
    expect(forgotten).toBe(1);
  });

  it("offers it only once the factor is on", async () => {
    mfaServer({ enabled: false });
    render(<TwoFactorCard />);

    await screen.findByRole("button", { name: "Turn on" });
    expect(
      screen.queryByRole("button", {
        name: "Ask for the code again on all my browsers",
      }),
    ).toBeNull();
  });
});
