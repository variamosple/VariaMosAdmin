import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trash } from "react-bootstrap-icons";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./index";

describe("IconButton", () => {
  it("is named by its label, which is also its tooltip", () => {
    render(<IconButton label="Delete role" icon={<Trash />} />);

    const button = screen.getByRole("button", { name: "Delete role" });
    expect(button).toHaveAttribute("title", "Delete role");
  });

  it("hides the icon from screen readers", () => {
    render(<IconButton label="Delete role" icon={<Trash />} />);

    const icon = screen.getByRole("button").querySelector("svg");
    expect(icon?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("passes the button props through", async () => {
    const onClick = vi.fn();
    render(
      <IconButton
        label="Delete role"
        icon={<Trash />}
        variant="danger"
        onClick={onClick}
      />,
    );

    const button = screen.getByRole("button", { name: "Delete role" });
    expect(button).toHaveClass("btn-danger");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
