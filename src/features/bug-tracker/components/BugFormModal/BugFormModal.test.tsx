import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { BugFormModal } from "./index";

describe("BugFormModal Component", () => {
  const mockOnHide = jest.fn();
  const mockOnSubmit = jest.fn();
  const sampleRepos = ["repo1", "repo2"];
  const sampleCategories = ["UI", "Backend", "Other"];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when show is false", () => {
    render(
      <BugFormModal
        show={false}
        onHide={mockOnHide}
        onSubmit={mockOnSubmit}
        repos={sampleRepos}
        categories={sampleCategories}
        isSubmitting={false}
      />,
    );
    expect(screen.queryByText("Report a New Bug")).not.toBeInTheDocument();
  });

  it("renders correctly in user mode", () => {
    render(
      <BugFormModal
        show={true}
        onHide={mockOnHide}
        onSubmit={mockOnSubmit}
        repos={sampleRepos}
        categories={sampleCategories}
        isSubmitting={false}
        mode="user"
      />,
    );
    expect(screen.getByText("Report a New Bug")).toBeInTheDocument();
    expect(screen.getByLabelText(/Title \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category \*/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Target Repository/i)).not.toBeInTheDocument();
  });

  it("renders correctly in admin mode", () => {
    render(
      <BugFormModal
        show={true}
        onHide={mockOnHide}
        onSubmit={mockOnSubmit}
        repos={sampleRepos}
        categories={sampleCategories}
        isSubmitting={false}
        mode="admin"
      />,
    );
    expect(screen.getByText("Report a GitHub Bug")).toBeInTheDocument();
    expect(screen.getByLabelText(/Title \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Repository \(GitHub\) \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priority \*/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Category \*/i)).not.toBeInTheDocument();
  });

  it("shows validation errors for required fields in user mode", async () => {
    render(
      <BugFormModal
        show={true}
        onHide={mockOnHide}
        onSubmit={mockOnSubmit}
        repos={sampleRepos}
        categories={sampleCategories}
        isSubmitting={false}
        mode="user"
      />,
    );

    fireEvent.submit(screen.getByRole("button", { name: "Report Bug" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(await screen.findByText("Description is required")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("shows validation errors for required fields in admin mode", async () => {
    render(
      <BugFormModal
        show={true}
        onHide={mockOnHide}
        onSubmit={mockOnSubmit}
        repos={sampleRepos}
        categories={sampleCategories}
        isSubmitting={false}
        mode="admin"
      />,
    );

    fireEvent.submit(screen.getByRole("button", { name: "Report Bug" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(await screen.findByText("Description is required")).toBeInTheDocument();
    expect(await screen.findByText("Target repository is required")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits valid form data in user mode", async () => {
    render(
      <BugFormModal
        show={true}
        onHide={mockOnHide}
        onSubmit={mockOnSubmit}
        repos={sampleRepos}
        categories={sampleCategories}
        isSubmitting={false}
        mode="user"
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Title \*/i), "Test Bug Title");
    await user.type(screen.getByLabelText(/Description \*/i), "Test Description content");
    await user.selectOptions(screen.getByLabelText(/Category \*/i), "Backend");

    fireEvent.submit(screen.getByRole("button", { name: "Report Bug" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Bug Title",
          description: "Test Description content",
          category: "Backend",
        }),
        undefined,
      );
    });
  });

  it("submits valid form data with file attachment", async () => {
    render(
      <BugFormModal
        show={true}
        onHide={mockOnHide}
        onSubmit={mockOnSubmit}
        repos={sampleRepos}
        categories={sampleCategories}
        isSubmitting={false}
        mode="user"
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Title \*/i), "Test Bug Title");
    await user.type(screen.getByLabelText(/Description \*/i), "Test Description content");

    const file = new File(["dummy content"], "screenshot.png", { type: "image/png" });
    const fileInput = screen.getByLabelText(/Attachment \(Optional\)/i);

    // Simulate file upload
    await user.upload(fileInput, file);

    fireEvent.submit(screen.getByRole("button", { name: "Report Bug" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Bug Title",
          description: "Test Description content",
        }),
        file,
      );
    });
  });

  it("calls onHide when Cancel button is clicked", async () => {
    render(
      <BugFormModal
        show={true}
        onHide={mockOnHide}
        onSubmit={mockOnSubmit}
        repos={sampleRepos}
        categories={sampleCategories}
        isSubmitting={false}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockOnHide).toHaveBeenCalledTimes(1);
  });
});
