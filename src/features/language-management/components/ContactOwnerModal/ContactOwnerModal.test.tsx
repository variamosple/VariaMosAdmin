import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactOwnerModal } from "./index";

describe("ContactOwnerModal Component", () => {
  const mockOnClose = vi.fn();
  const mockOwners = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      accessLevel: "OWNER",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      accessLevel: "COLLABORATOR",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href safely
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "",
    });
  });

  it("renders correctly with owners and inputs", () => {
    render(
      <ContactOwnerModal
        show={true}
        onClose={mockOnClose}
        owners={mockOwners}
        languageName="MyDSL"
      />,
    );

    expect(screen.getByText("Contact Owners of MyDSL")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Write your message here..."),
    ).toBeInTheDocument();
  });

  it("triggers mailto redirection on Send Email", async () => {
    const user = userEvent.setup();
    render(
      <ContactOwnerModal
        show={true}
        onClose={mockOnClose}
        owners={mockOwners}
        languageName="MyDSL"
      />,
    );

    const sendLink = screen.getByRole("link", { name: "Send Email" });
    expect(sendLink).toHaveAttribute("href");

    const href = sendLink.getAttribute("href");
    expect(href).toContain("mailto:john@example.com,jane@example.com");
    expect(href).toContain("subject=Inquiry%20regarding%20Language%3A%20MyDSL");

    await user.click(sendLink);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
