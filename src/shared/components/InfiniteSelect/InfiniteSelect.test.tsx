import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    expect(screen.getByText("Choose language")).toBeInTheDocument();
  });

  it("should toggle dropdown and render options on click", async () => {
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
    const user = userEvent.setup();
    const trigger = screen.getByRole("button");
    await user.click(trigger);

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("should call handleSelect and close dropdown when an option is clicked", async () => {
    const user = userEvent.setup();
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
    await user.click(trigger);

    const optionBtn = screen.getByText("Option 2");
    await user.click(optionBtn);

    expect(mockHandleSelect).toHaveBeenCalledWith({ label: "Option 2", value: "val-2" });
    // Verify dropdown was closed
    expect(screen.queryByText("Option 1")).toBeNull();
  });

  it("should render spinner when isFetchingOptions is true and options are empty", async () => {
    const user = userEvent.setup();
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
    await user.click(trigger);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should render 'No options available' when list is empty and not loading", async () => {
    const user = userEvent.setup();
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
    await user.click(trigger);

    expect(screen.getByText("No options available")).toBeInTheDocument();
  });

  it("should support searchable input field and call setSearchInput on change", async () => {
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

    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.change(input, { target: { value: "new-query" } });
    expect(mockSetSearchInput).toHaveBeenCalledWith("new-query");
  });

  it("should attach lastOptionRef to the last option element", async () => {
    const user = userEvent.setup();
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
    await user.click(trigger);

    expect(mockLastOptionRef).toHaveBeenCalled();
  });
});
