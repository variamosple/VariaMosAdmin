import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { InfiniteSelect } from "./index";
import { SelectOptionProps } from "./index.types";

const mockOptions: SelectOptionProps<string>[] = [
  { label: "Option 1", value: "val-1" },
  { label: "Option 2", value: "val-2" },
  { label: "Option 3", value: "val-3" },
];

describe("InfiniteSelect Component", () => {
  const mockHandleSelect = jest.fn();
  const mockSetSearchInput = jest.fn();
  const mockLastOptionRef = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render placeholder when no option is selected", () => {
    render(
      <InfiniteSelect
        options={mockOptions}
        isFetchingOptions={false}
        lastOptionRef={mockLastOptionRef}
        isSearchable={false}
        placeholder="Choose language"
        handleSelect={mockHandleSelect}
      />,
    );

    expect(screen.getByText("Choose language")).toBeDefined();
  });

  it("should toggle dropdown and render options on click", () => {
    render(
      <InfiniteSelect
        options={mockOptions}
        isFetchingOptions={false}
        lastOptionRef={mockLastOptionRef}
        isSearchable={false}
        placeholder="Choose language"
        handleSelect={mockHandleSelect}
      />,
    );

    // Open dropdown
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    expect(screen.getByText("Option 1")).toBeDefined();
    expect(screen.getByText("Option 2")).toBeDefined();
    expect(screen.getByText("Option 3")).toBeDefined();
  });

  it("should call handleSelect and close dropdown when an option is clicked", () => {
    render(
      <InfiniteSelect
        options={mockOptions}
        isFetchingOptions={false}
        lastOptionRef={mockLastOptionRef}
        isSearchable={false}
        handleSelect={mockHandleSelect}
      />,
    );

    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    const optionBtn = screen.getByText("Option 2");
    fireEvent.click(optionBtn);

    expect(mockHandleSelect).toHaveBeenCalledWith({ label: "Option 2", value: "val-2" });
    // Verify dropdown was closed
    expect(screen.queryByText("Option 1")).toBeNull();
  });

  it("should render spinner when isFetchingOptions is true and options are empty", () => {
    render(
      <InfiniteSelect
        options={[]}
        isFetchingOptions={true}
        lastOptionRef={mockLastOptionRef}
        isSearchable={false}
        handleSelect={mockHandleSelect}
      />,
    );

    // Open dropdown
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    expect(screen.getByRole("status")).toBeDefined();
  });

  it("should render 'No options available' when list is empty and not loading", () => {
    render(
      <InfiniteSelect
        options={[]}
        isFetchingOptions={false}
        lastOptionRef={mockLastOptionRef}
        isSearchable={false}
        handleSelect={mockHandleSelect}
      />,
    );

    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    expect(screen.getByText("No options available")).toBeDefined();
  });

  it("should support searchable input field and call setSearchInput on change", () => {
    render(
      <InfiniteSelect
        options={mockOptions}
        isFetchingOptions={false}
        lastOptionRef={mockLastOptionRef}
        isSearchable={true}
        searchInput="test-query"
        setSearchInput={mockSetSearchInput}
        handleSelect={mockHandleSelect}
      />,
    );

    const input = screen.getByPlaceholderText("Select");
    expect((input as HTMLInputElement).value).toBe("test-query");

    fireEvent.change(input, { target: { value: "new-query" } });
    expect(mockSetSearchInput).toHaveBeenCalledWith("new-query");
  });

  it("should attach lastOptionRef to the last option element", () => {
    render(
      <InfiniteSelect
        options={mockOptions}
        isFetchingOptions={false}
        lastOptionRef={mockLastOptionRef}
        isSearchable={false}
        handleSelect={mockHandleSelect}
      />,
    );

    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    expect(mockLastOptionRef).toHaveBeenCalled();
  });
});
