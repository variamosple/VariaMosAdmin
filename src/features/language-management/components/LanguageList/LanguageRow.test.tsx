import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Language } from "../../domain/Entity/Language";
import { LanguageRowComponent } from "./LanguageRow";

describe("LanguageRowComponent", () => {
  const mockOnLanguageEdit = vi.fn();
  const mockOnLanguageDelete = vi.fn();

  const mockActiveLanguage: Language = {
    id: 1,
    name: "Active DSL",
    type: "DSL",
    stateAccept: "ACTIVE",
    owners: [
      {
        id: "1",
        name: "Alice",
        email: "alice@example.com",
        accessLevel: "OWNER",
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPendingLanguage: Language = {
    id: 2,
    name: "Pending DSL",
    type: "DSL",
    stateAccept: "PENDING",
    owners: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders active language row with appropriate actions", () => {
    render(
      <table>
        <tbody>
          <LanguageRowComponent
            language={mockActiveLanguage}
            onLanguageEdit={mockOnLanguageEdit}
            onLanguageDelete={mockOnLanguageDelete}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("Active DSL")).toBeInTheDocument();
    expect(screen.getByTitle("Deactivate language")).toBeInTheDocument();
    expect(screen.queryByTitle("Activate language")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Delete language")).not.toBeInTheDocument();
  });

  it("renders pending language row with appropriate actions", () => {
    render(
      <table>
        <tbody>
          <LanguageRowComponent
            language={mockPendingLanguage}
            onLanguageEdit={mockOnLanguageEdit}
            onLanguageDelete={mockOnLanguageDelete}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("Pending DSL")).toBeInTheDocument();
    expect(screen.getByTitle("Activate language")).toBeInTheDocument();
    expect(screen.queryByTitle("Deactivate language")).not.toBeInTheDocument();
    expect(screen.getByTitle("Delete language")).toBeInTheDocument();
  });

  it("shows contact owners option if owners are present", async () => {
    const user = userEvent.setup();
    render(
      <table>
        <tbody>
          <LanguageRowComponent
            language={mockActiveLanguage}
            onLanguageEdit={mockOnLanguageEdit}
            onLanguageDelete={mockOnLanguageDelete}
          />
        </tbody>
      </table>,
    );

    const expandButton = screen.getByTitle("Show/Hide language details");
    await user.click(expandButton);

    expect(screen.getByText("Contact Owners")).toBeInTheDocument();
  });
});
