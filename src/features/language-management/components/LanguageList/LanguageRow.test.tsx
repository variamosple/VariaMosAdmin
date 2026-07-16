import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageRowComponent } from "./LanguageRow";
import { Language } from "../../domain/Entity/Language";

const mockLanguage: Language = {
  id: 1,
  name: "My Language",
  type: "DSL",
  stateAccept: "ACTIVE",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  updatedAt: new Date("2026-01-01T13:30:00Z"),
  owners: [
    { id: "1", name: "Owner User", email: "owner@test.com", accessLevel: "OWNER" },
    { id: "2", name: "Guest User", email: "guest@test.com", accessLevel: "VIEW" },
  ],
};

describe("LanguageRowComponent", () => {
  const mockOnLanguageEdit = jest.fn();
  const mockOnLanguageDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderInTable = (element: React.ReactElement) => {
    return render(
      <table>
        <tbody>{element}</tbody>
      </table>,
    );
  };

  it("renders row information correctly including formatted dates and the owner", () => {
    renderInTable(
      <LanguageRowComponent
        language={mockLanguage}
        onLanguageEdit={mockOnLanguageEdit}
        onLanguageDelete={mockOnLanguageDelete}
      />,
    );

    // Verify properties
    expect(screen.getByText("My Language")).toBeDefined();
    expect(screen.getByText("DSL")).toBeDefined();
    expect(screen.getByText("ACTIVE")).toBeDefined();

    // Verify Owner displayed
    expect(screen.getByText("Owner User")).toBeDefined();

    // Verify Date formatting
    expect(screen.getAllByText(/2026/)).toHaveLength(2);
  });

  it("toggles the language details when clicking the expand button", () => {
    renderInTable(
      <LanguageRowComponent
        language={mockLanguage}
        onLanguageEdit={mockOnLanguageEdit}
        onLanguageDelete={mockOnLanguageDelete}
      />,
    );

    // Initially details are not visible
    expect(screen.queryByText("Owners")).toBeNull();

    // Click show details
    const showButton = screen.getByTitle("Show/Hide language details");
    fireEvent.click(showButton);

    // Details should now be visible
    expect(screen.getByText("Owners")).toBeDefined();
    expect(screen.getByText(/Owner User \(owner@test.com\)/)).toBeDefined();
    expect(screen.getByText(/Guest User \(guest@test.com\)/)).toBeDefined();

    // Click to collapse
    fireEvent.click(showButton);
    expect(screen.queryByText("Owners")).toBeNull();
  });

  it("triggers callbacks when edit and delete buttons are clicked", () => {
    renderInTable(
      <LanguageRowComponent
        language={mockLanguage}
        onLanguageEdit={mockOnLanguageEdit}
        onLanguageDelete={mockOnLanguageDelete}
      />,
    );

    fireEvent.click(screen.getByTitle("Edit language"));
    expect(mockOnLanguageEdit).toHaveBeenCalledWith(mockLanguage);

    fireEvent.click(screen.getByTitle("Delete language"));
    expect(mockOnLanguageDelete).toHaveBeenCalledWith(mockLanguage);
  });
});
