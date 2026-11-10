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

describe("ConfigurationFormModal accepted values", () => {
  const interval = configuration({
    key: "bugs.sync_interval_minutes",
    value: 15,
    type: "number",
    category: "general",
    isSecret: false,
    isApplied: true,
    accepts: {
      text: "a whole number of minutes from 5 to 1440",
      min: 5,
      max: 1440,
      unit: "minutes",
    },
  });

  it("says what the key accepts and bounds the number field", () => {
    renderForm(interval);

    expect(
      screen.getByText("Accepted: a whole number of minutes from 5 to 1440."),
    ).toBeTruthy();
    const field = screen.getByLabelText("Value");
    expect(field.getAttribute("min")).toBe("5");
    expect(field.getAttribute("max")).toBe("1440");
  });

  it.each(["4", "1441", "7.5"])(
    "refuses %s before sending it",
    async (typed) => {
      const user = userEvent.setup();
      const { onConfigSubmit } = renderForm(interval);
      const field = screen.getByLabelText("Value");

      await user.clear(field);
      await user.type(field, typed);
      await user.click(screen.getByRole("button", { name: "Apply Changes" }));

      expect(
        screen.getByText("Enter a whole number of minutes from 5 to 1440."),
      ).toBeTruthy();
      expect(onConfigSubmit).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["5", 5],
    ["1440", 1440],
  ])("sends %s, within the bounds", async (typed, sent) => {
    const user = userEvent.setup();
    const { onConfigSubmit } = renderForm(interval);
    const field = screen.getByLabelText("Value");

    await user.clear(field);
    await user.type(field, typed);
    await user.click(screen.getByRole("button", { name: "Apply Changes" }));

    expect(onConfigSubmit).toHaveBeenCalledWith(
      "bugs.sync_interval_minutes",
      sent,
    );
  });

  it("sends any number for a key without bounds", async () => {
    const user = userEvent.setup();
    const { onConfigSubmit } = renderForm(
      configuration({ type: "number", value: 1, isSecret: false }),
    );
    const field = screen.getByLabelText("Value");

    await user.clear(field);
    await user.type(field, "-3.5");
    await user.click(screen.getByRole("button", { name: "Apply Changes" }));

    expect(onConfigSubmit).toHaveBeenCalledWith(
      "notification.smtp.password",
      -3.5,
    );
  });

  it("offers the known time zones and shows the form of a span", () => {
    const { unmount } = render(
      <ConfigurationFormModal
        showModal={true}
        onClose={vi.fn()}
        onConfigSubmit={vi.fn()}
        config={configuration({
          key: "security.alerts.timezone",
          value: "UTC",
          isSecret: false,
          accepts: { text: "a time zone name", format: "timeZone" },
        })}
      />,
    );
    const zones = screen.getByLabelText("Value").getAttribute("list");
    expect(
      document.querySelector(`[id="${zones}"] option[value="America/Bogota"]`),
    ).toBeTruthy();
    unmount();

    renderForm(
      configuration({
        key: "security.alerts.off_hours",
        value: "",
        isSecret: false,
        accepts: { text: "a span", format: "timeSpan" },
      }),
    );
    expect(screen.getByPlaceholderText("20:00-07:00")).toBeTruthy();
    expect(screen.getByLabelText("Value").getAttribute("list")).toBeNull();
  });
});
