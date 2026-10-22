import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MfaCodeForm } from "./index";

describe("MfaCodeForm", () => {
  it("sends the code without spaces around it", async () => {
    const user = userEvent.setup();
    const onSubmitCode = vi.fn();
    render(
      <MfaCodeForm
        onSubmitCode={onSubmitCode}
        onCancel={vi.fn()}
        isLoading={false}
      />,
    );

    await user.type(screen.getByLabelText("Authentication code"), " 123456 ");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() =>
      expect(onSubmitCode).toHaveBeenCalledWith("123456", false),
    );
  });

  it("offers not to ask again on this browser, unchecked", async () => {
    const user = userEvent.setup();
    const onSubmitCode = vi.fn();
    render(
      <MfaCodeForm
        onSubmitCode={onSubmitCode}
        onCancel={vi.fn()}
        isLoading={false}
        trustedDeviceDays={14}
      />,
    );
    const remember = screen.getByLabelText(
      "Don't ask for a code on this browser for 14 days",
    );
    expect(remember).not.toBeChecked();

    await user.click(remember);
    await user.type(screen.getByLabelText("Authentication code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() =>
      expect(onSubmitCode).toHaveBeenCalledWith("123456", true),
    );
  });

  it("does not offer it when the option is off", () => {
    render(
      <MfaCodeForm
        onSubmitCode={vi.fn()}
        onCancel={vi.fn()}
        isLoading={false}
        trustedDeviceDays={0}
      />,
    );

    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("requires a code", async () => {
    const user = userEvent.setup();
    const onSubmitCode = vi.fn();
    render(
      <MfaCodeForm
        onSubmitCode={onSubmitCode}
        onCancel={vi.fn()}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByText("The code is required")).toBeInTheDocument();
    expect(onSubmitCode).not.toHaveBeenCalled();
  });

  it("goes back to the password", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <MfaCodeForm
        onSubmitCode={vi.fn()}
        onCancel={onCancel}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Back to sign in" }));

    expect(onCancel).toHaveBeenCalled();
  });
});
