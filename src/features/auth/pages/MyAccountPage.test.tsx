import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MyAccountPage } from "./MyAccountPage";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

// Mock @variamosple/variamos-components
jest.mock("@variamosple/variamos-components", () => ({
  withPageVisit: (component: any) => component,
  PagedModel: class PagedModel {},
}));

// Mock sub-components
jest.mock("../components/PasswordUpdateForm", () => ({
  PasswordUpdateForm: ({ showModal, onClose, onUpdatePasswordSubmit, isLoading }: any) => {
    if (!showModal) return null;
    return (
      <div data-testid="password-update-form">
        <span>Loading: {isLoading ? "Yes" : "No"}</span>
        <button
          onClick={() => onUpdatePasswordSubmit({ currentPassword: "123", newPassword: "456" })}
        >
          Submit Password Update
        </button>
        <button onClick={onClose}>Close Password Modal</button>
      </div>
    );
  },
}));

jest.mock("@/features/user-management/components/UserInformationUpdateFormModal", () => ({
  PersonalInformationUpdateForModal: ({
    showModal,
    onClose,
    onUpdatePersonalInformationSubmit,
    defaultValue,
    isLoading,
  }: any) => {
    if (!showModal) return null;
    return (
      <div data-testid="info-update-form">
        <span>Loading: {isLoading ? "Yes" : "No"}</span>
        <span>Country: {defaultValue?.countryCode}</span>
        <button onClick={() => onUpdatePersonalInformationSubmit({ countryCode: "FR" })}>
          Submit Info Update
        </button>
        <button onClick={onClose}>Close Info Modal</button>
      </div>
    );
  },
}));

describe("MyAccountPage Component", () => {
  const mockUser = {
    id: "1",
    name: "John Doe",
    user: "johndoe",
    email: "john@example.com",
    countryCode: "US",
    countryName: "United States",
  };

  beforeEach(() => {
    server.use(
      http.get(apiTarget("/auth/my-account"), () => {
        return HttpResponse.json({ data: mockUser });
      }),
      http.put(apiTarget("/auth/my-account/information"), () => {
        return HttpResponse.json({ errorCode: null });
      }),
      http.put(apiTarget("/auth/password-update"), () => {
        return HttpResponse.json({ errorCode: null });
      }),
    );
  });

  it("renders loader initially then queries user account info", async () => {
    // Create a promise we control to inspect loading state
    let resolvePromise: any;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });

    server.use(
      http.get(apiTarget("/auth/my-account"), async () => {
        await promise;
        return HttpResponse.json({ data: mockUser });
      }),
    );

    render(<MyAccountPage />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument(); // Loader Spinner

    resolvePromise();

    await screen.findByText("My account");
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("johndoe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("handles password update form submission successfully", async () => {
    let updatePasswordPayload: any = null;
    server.use(
      http.put(apiTarget("/auth/password-update"), async ({ request }) => {
        updatePasswordPayload = await request.json();
        return HttpResponse.json({ errorCode: null });
      }),
    );

    render(<MyAccountPage />);

    await screen.findByText("My account");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /update/i }));
    expect(screen.getByTestId("password-update-form")).toBeInTheDocument();

    await user.click(screen.getByText("Submit Password Update"));

    await waitFor(() => {
      expect(updatePasswordPayload).toEqual({
        currentPassword: "123",
        newPassword: "456",
      });
    });
    expect(screen.queryByTestId("password-update-form")).not.toBeInTheDocument();
  });

  it("handles personal information update submission successfully", async () => {
    let updatePersonalInformationPayload: any = null;
    let getMyAccountCalledCount = 0;
    server.use(
      http.get(apiTarget("/auth/my-account"), () => {
        getMyAccountCalledCount++;
        return HttpResponse.json({ data: mockUser });
      }),
      http.put(apiTarget("/auth/my-account/information"), async ({ request }) => {
        updatePersonalInformationPayload = await request.json();
        return HttpResponse.json({ errorCode: null });
      }),
    );

    render(<MyAccountPage />);

    await screen.findByText("My account");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /edit information/i }));
    expect(screen.getByTestId("info-update-form")).toBeInTheDocument();
    expect(screen.getByText("Country: US")).toBeInTheDocument();

    await user.click(screen.getByText("Submit Info Update"));

    await waitFor(() => {
      expect(updatePersonalInformationPayload).toEqual({ countryCode: "FR" });
    });
    expect(screen.queryByTestId("info-update-form")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(getMyAccountCalledCount).toBe(2); // Initial query + query after update
    });
  });

  it("closes modals on cancel/close click", async () => {
    render(<MyAccountPage />);

    await screen.findByText("My account");

    const user = userEvent.setup();
    // Test password modal close
    await user.click(screen.getByRole("button", { name: /update/i }));
    await user.click(screen.getByText("Close Password Modal"));
    expect(screen.queryByTestId("password-update-form")).not.toBeInTheDocument();

    // Test info modal close
    await user.click(screen.getByRole("button", { name: /edit information/i }));
    await user.click(screen.getByText("Close Info Modal"));
    expect(screen.queryByTestId("info-update-form")).not.toBeInTheDocument();
  });
});
