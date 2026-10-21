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

    await waitFor(() => expect(onSubmitCode).toHaveBeenCalledWith("123456"));
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
