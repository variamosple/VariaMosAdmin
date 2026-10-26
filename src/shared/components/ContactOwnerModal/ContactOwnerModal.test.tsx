import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContactOwnerModal } from "./index";

describe("ContactOwnerModal - Behavior & Anti-Fragile Tests", () => {
  const defaultOwners = [
    { id: 1, name: "Alice Dupont", email: "alice@variamos.org" },
    { id: 2, name: "Bob Martin", email: "bob@variamos.org" },
  ];

  it("renders modal header with entity name and default general inquiry subject", () => {
    render(
      <ContactOwnerModal
        show={true}
        onClose={vi.fn()}
        owners={defaultOwners}
        entityName="FeatureIDE"
        entityType="Language"
      />,
    );

    expect(
      screen.getByText("Contact Owners of FeatureIDE"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/i)).toHaveValue("GENERAL_INQUIRY");

    const sendEmailLink = screen.getByRole("link", { name: /Send Email/i });
    expect(sendEmailLink).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:alice@variamos.org,bob@variamos.org"),
    );
  });

  it("updates subject and custom body in mailto link when user types", async () => {
    const user = userEvent.setup();
    render(
      <ContactOwnerModal
        show={true}
        onClose={vi.fn()}
        owners={defaultOwners}
        entityName="IoT-Domain"
        entityType="Project"
      />,
    );

    const subjectSelect = screen.getByLabelText(/Subject/i);
    await user.selectOptions(subjectSelect, "BUG_REPORT");

    const messageInput = screen.getByPlaceholderText(
      /Write your message here/i,
    );
    await user.type(messageInput, "Crash when compiling models");

    const sendEmailLink = screen.getByRole("link", { name: /Send Email/i });
    const href = sendEmailLink.getAttribute("href") || "";

    expect(href).toContain("mailto:alice@variamos.org,bob@variamos.org");
    expect(href).toContain("Bug%20Report%20for%20Project%3A%20IoT-Domain");
    expect(href).toContain("Crash%20when%20compiling%20models");
  });

  it("disables send email action when no valid owner email is provided", () => {
    render(
      <ContactOwnerModal
        show={true}
        onClose={vi.fn()}
        owners={[{ id: 99, name: "Ghost Owner", email: "" }]}
        entityName="GhostModule"
        entityType="Model"
      />,
    );

    const sendEmailLink = screen.getByText("Send Email");
    expect(sendEmailLink).toHaveClass("disabled");
    expect(sendEmailLink).not.toHaveAttribute("href");
    expect(
      screen.getByText(
        "No email address is registered for the owners of GhostModule.",
      ),
    ).toBeInTheDocument();
  });

  it("names the owners the email will not reach", () => {
    render(
      <ContactOwnerModal
        show={true}
        onClose={vi.fn()}
        owners={[...defaultOwners, { id: 3, name: "Carol Ghost" }]}
        entityName="FeatureIDE"
        entityType="Language"
      />,
    );

    expect(screen.getByRole("link", { name: /Send Email/i })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:alice@variamos.org,bob@variamos.org?"),
    );
    expect(screen.getByText(/Not reached/)).toHaveTextContent("Carol Ghost");
  });

  it("calls onClose when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    render(
      <ContactOwnerModal
        show={true}
        onClose={onCloseMock}
        owners={defaultOwners}
        entityName="FeatureIDE"
        entityType="Language"
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });
});
