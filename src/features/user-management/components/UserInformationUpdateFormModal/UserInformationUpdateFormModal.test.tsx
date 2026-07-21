import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { PersonalInformationUpdateForModal } from "./index";
import { useQuery } from "@variamosple/variamos-components";

// Mock @variamosple/variamos-components completely
jest.mock("@variamosple/variamos-components", () => {
  return {
    useQuery: jest.fn(),
    ResponseModel: class ResponseModel {
      errorCode?: number | null;
      message?: string;
      constructor(code?: number | null, msg?: string) {
        this.errorCode = code;
        this.message = msg;
      }
    },
  };
});

describe("PersonalInformationUpdateForModal Component", () => {
  const useQueryMock = useQuery as jest.Mock;
  const mockLoadData = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();

  const mockCountries = [
    { code: "CO", name: "Colombia" },
    { code: "US", name: "United States" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for useQuery
    useQueryMock.mockReturnValue({
      data: mockCountries,
      isLoading: false,
      isLoaded: true,
      loadData: mockLoadData,
    });
  });

  it("does not render when showModal is false", () => {
    render(
      <PersonalInformationUpdateForModal
        onUpdatePersonalInformationSubmit={mockOnSubmit}
        showModal={false}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders modal structure and calls loadData if countries not loaded", async () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isLoaded: false,
      loadData: mockLoadData,
    });

    render(
      <PersonalInformationUpdateForModal
        onUpdatePersonalInformationSubmit={mockOnSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("PersonalInformation update")).toBeInTheDocument();
    expect(mockLoadData).toHaveBeenCalledWith(null);
  });

  it("shows loading message while loading countries", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: true,
      isLoaded: false,
      loadData: mockLoadData,
    });

    render(
      <PersonalInformationUpdateForModal
        onUpdatePersonalInformationSubmit={mockOnSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Loading Countries...")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders countries dropdown and submits correctly", async () => {
    mockOnSubmit.mockResolvedValue({ errorCode: null });

    render(
      <PersonalInformationUpdateForModal
        onUpdatePersonalInformationSubmit={mockOnSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={false}
        defaultValue={{ countryCode: "US" }}
      />,
    );

    const select = screen.getByRole("combobox", { name: /select your country/i });
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("US");

    // Change value
    const user = userEvent.setup();
    await user.selectOptions(select, "CO");
    expect(select).toHaveValue("CO");

    // Submit
    fireEvent.submit(screen.getByRole("button", { name: /update information/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ countryCode: "CO" }));
    });
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PersonalInformationUpdateForModal
        onUpdatePersonalInformationSubmit={mockOnSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows spinner on submit button when isLoading is true", () => {
    render(
      <PersonalInformationUpdateForModal
        onUpdatePersonalInformationSubmit={mockOnSubmit}
        showModal={true}
        onClose={mockOnClose}
        isLoading={true}
      />,
    );

    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });
});
