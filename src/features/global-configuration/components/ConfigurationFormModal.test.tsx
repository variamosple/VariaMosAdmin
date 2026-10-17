import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Configuration } from "../domain/Entity/Configuration";
import { ConfigurationFormModal } from "./ConfigurationFormModal";

const configuration = (overrides: Partial<Configuration>): Configuration => ({
  id: 1,
  key: "notification.smtp.password",
  value: "********",
  type: "string",
  category: "notification",
  requiresMfa: false,
  isSecret: true,
  environmentScope: "all",
  isReadOnly: false,
  targetServices: ["variamos_ms_notifications"],
  ...overrides,
});

const renderForm = (config: Configuration) => {
  const onConfigSubmit = vi.fn();
  const onClose = vi.fn();
  render(
    <ConfigurationFormModal
      showModal={true}
      onClose={onClose}
      config={config}
      onConfigSubmit={onConfigSubmit}
    />,
  );
  return { onConfigSubmit, onClose };
};

describe("ConfigurationFormModal secrets", () => {
  it("starts a secret from an empty password field, not from the mask", () => {
    renderForm(configuration({}));

    const input = screen.getByPlaceholderText("New value");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("type", "password");
    expect(screen.queryByDisplayValue("********")).not.toBeInTheDocument();
  });

  it("does not submit a secret without a new value", async () => {
    const user = userEvent.setup();
    const { onConfigSubmit } = renderForm(configuration({}));

    await user.click(screen.getByRole("button", { name: "Apply Changes" }));

    expect(onConfigSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("Enter a new value for this secret."),
    ).toBeInTheDocument();
  });

  it("submits the new secret value", async () => {
    const user = userEvent.setup();
    const { onConfigSubmit } = renderForm(configuration({}));

    await user.type(screen.getByPlaceholderText("New value"), "new-password");
    await user.click(screen.getByRole("button", { name: "Apply Changes" }));

    expect(onConfigSubmit).toHaveBeenCalledWith(
      "notification.smtp.password",
      "new-password",
    );
  });

  it("still prefills a non-secret value", () => {
    renderForm(
      configuration({
        key: "general.site_name",
        value: "VariaMos",
        isSecret: false,
        category: "general",
      }),
    );

    expect(screen.getByDisplayValue("VariaMos")).toBeInTheDocument();
  });
});

describe("ConfigurationFormModal applied keys", () => {
  const notice = /No service reads this configuration yet/;

  it("warns that a key without consumer has no effect", () => {
    renderForm(configuration({ isSecret: false, isApplied: false }));

    expect(screen.getByText(notice)).toBeTruthy();
  });

  it.each([true, undefined])(
    "shows no warning when isApplied is %s",
    (isApplied) => {
      renderForm(configuration({ isSecret: false, isApplied }));

      expect(screen.queryByText(notice)).toBeNull();
    },
  );
});
