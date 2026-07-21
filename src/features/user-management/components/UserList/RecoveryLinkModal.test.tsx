import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { RecoveryLinkModal } from "./RecoveryLinkModal";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

// Mock @variamosple/variamos-components to prevent ESM SyntaxError
jest.mock("@variamosple/variamos-components", () => {
  return {
    ResponseModel: class ResponseModel {
      errorCode?: number;
      message?: string;
      data?: any;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
      withError(code: number, msg: string) {
        this.errorCode = code;
        this.message = msg;
        return this;
      }
    },
  };
});

// Mock ToastContext
const mockPushToast = jest.fn();
jest.mock("@/shared/context/ToastContext", () => ({
  useToast: () => ({
    pushToast: mockPushToast,
  }),
}));

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("RecoveryLinkModal Component", () => {
  const mockOnHide = jest.fn();
  const mockUser = {
    id: "user-123",
    user: "bob",
    name: "Bob Smith",
    email: "bob@smith.com",
    isEnabled: true,
    isDeleted: false,
    createdAt: new Date(),
  };

  let recoveryLinkCalled = 0;
  let delayRecoveryQuery = false;
  let resolveRecoveryPromise: any;
  let isRecoveryError = false;

  beforeEach(() => {
    jest.clearAllMocks();
    recoveryLinkCalled = 0;
    delayRecoveryQuery = false;
    isRecoveryError = false;

    // Mock navigator.clipboard using Object.defineProperty
    const mockClipboard = {
      writeText: jest.fn().mockImplementation(() => Promise.resolve()),
    };
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      configurable: true,
      writable: true,
    });

    server.use(
      http.post(apiTarget("/v1/users/:userId/recovery-link"), () => {
        recoveryLinkCalled++;
        if (isRecoveryError) {
          return HttpResponse.json({
            errorCode: 400,
            message: "Unable to generate link",
          });
        }
        if (delayRecoveryQuery) {
          return new Promise((resolve) => {
            resolveRecoveryPromise = resolve;
          });
        }
        return HttpResponse.json({
          data: { recoveryUrl: "https://variamos.com/recover?token=xyz" },
        });
      }),
    );
  });

  it("does not render when show is false", () => {
    render(<RecoveryLinkModal user={mockUser} show={false} onHide={mockOnHide} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders user information and a button to generate link", () => {
    render(<RecoveryLinkModal user={mockUser} show={true} onHide={mockOnHide} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate secure link/i })).toBeInTheDocument();
  });

  it("handles link generation successfully and displays the recovery link", async () => {
    delayRecoveryQuery = true;
    const user = userEvent.setup();
    render(<RecoveryLinkModal user={mockUser} show={true} onHide={mockOnHide} />);

    const generateBtn = screen.getByRole("button", { name: /generate secure link/i });
    await user.click(generateBtn);

    // Should show loader/spinner first
    expect(screen.getByText("Generating link...")).toBeInTheDocument();

    await act(async () => {
      resolveRecoveryPromise(
        HttpResponse.json({
          data: { recoveryUrl: "https://variamos.com/recover?token=xyz" },
        }),
      );
    });

    await waitFor(() => {
      expect(recoveryLinkCalled).toBe(1);
    });
    expect(
      await screen.findByDisplayValue("https://variamos.com/recover?token=xyz"),
    ).toBeInTheDocument();
  });

  it("handles copy to clipboard functionality", async () => {
    const user = userEvent.setup();
    const writeTextSpy = jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

    render(<RecoveryLinkModal user={mockUser} show={true} onHide={mockOnHide} />);

    const generateBtn = screen.getByRole("button", { name: /generate secure link/i });
    await user.click(generateBtn);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("https://variamos.com/recover?token=xyz"),
      ).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole("button", { name: "" }); // icon button has no label by default
    await user.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledWith("https://variamos.com/recover?token=xyz");
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Link copied",
        variant: "success",
      }),
    );
    expect(screen.getByText("Copied to clipboard!")).toBeInTheDocument();
  });

  it("handles generation error response", async () => {
    const user = userEvent.setup();
    isRecoveryError = true;

    render(<RecoveryLinkModal user={mockUser} show={true} onHide={mockOnHide} />);

    const generateBtn = screen.getByRole("button", { name: /generate secure link/i });
    await user.click(generateBtn);

    await waitFor(() => {
      expect(mockPushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Generation error",
          message: "Unable to generate link",
          variant: "danger",
        }),
      );
    });
  });
});
