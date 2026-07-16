import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageList } from "./index";
import { Language } from "../../domain/Entity/Language";

const mockLanguages: Language[] = [
  {
    id: 1,
    name: "Language One",
    type: "DSL",
    stateAccept: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Language Two",
    type: "DSL",
    stateAccept: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock the variamos-components library which has Paginator
jest.mock("@variamosple/variamos-components", () => {
  return {
    Paginator: () => <div data-testid="paginator">Paginator</div>,
  };
});

describe("LanguageList Component", () => {
  const mockOnLanguageEdit = jest.fn();
  const mockOnLanguageDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a list of languages correctly", () => {
    render(
      <LanguageList
        items={mockLanguages}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onLanguageEdit={mockOnLanguageEdit}
        onLanguageDelete={mockOnLanguageDelete}
      />,
    );

    expect(screen.getByText("Language One")).toBeDefined();
    expect(screen.getByText("Language Two")).toBeDefined();
  });

  it("triggers onLanguageEdit when the edit button is clicked", () => {
    render(
      <LanguageList
        items={mockLanguages}
        currentPage={1}
        totalPages={1}
        onPageChange={jest.fn()}
        onLanguageEdit={mockOnLanguageEdit}
        onLanguageDelete={mockOnLanguageDelete}
      />,
    );

    const editButtons = screen.getAllByTitle("Edit language");
    fireEvent.click(editButtons[0]);

    expect(mockOnLanguageEdit).toHaveBeenCalledTimes(1);
    expect(mockOnLanguageEdit).toHaveBeenCalledWith(mockLanguages[0]);
  });
});
