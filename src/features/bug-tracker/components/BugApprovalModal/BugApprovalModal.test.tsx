import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { BugApprovalModal } from "./index";
import { Bug } from "../../domain/Bug";
import { server } from "@/shared/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

// Mock @variamosple/variamos-components to avoid ESM import errors when BugRepository is loaded
jest.mock("@variamosple/variamos-components", () => {
  return {
    withPageVisit: (component: any) => component,
    ResponseModel: class ResponseModel {
      errorCode?: number;
      message?: string;
      data?: any;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
      withError(code: number, msg: string) {
        this.errorCode = code;
        this.message = msg;
        return this;
      }
    },
  };
});

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("BugApprovalModal Component", () => {
  const mockOnConfirmApprove = jest.fn();
  const mockOnHide = jest.fn();
  const sampleRepos = ["repo1", "repo2"];
  const sampleCategories = ["UI", "Backend", "Other"];

  const sampleBug: Bug = {
    id: "bug-123",
    title: "Old Title",
    description: "Old Description",
    priority: "low",
    category: "UI",
    githubRepo: "repo1",
    attachments: [
      { id: 1, filePath: "/path/to/att1.jpg", fileType: "image/jpeg", bugId: "bug-123" },
    ],
  };

  let uploadAttachmentParams: any[] = [];
  let deleteAttachmentParams: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    uploadAttachmentParams = [];
    deleteAttachmentParams = [];

    server.use(
      http.post(apiTarget("/bugs/:bugId/attachments"), ({ params }) => {
        uploadAttachmentParams.push({ bugId: params.bugId });
        return HttpResponse.json({
          data: {
            id: 2,
            filePath: "/path/to/att2.png",
            fileType: "image/png",
            bugId: params.bugId,
          },
        });
      }),
      http.delete(apiTarget("/bugs/attachments/:attachmentId"), ({ params }) => {
        deleteAttachmentParams.push(params.attachmentId);
        return HttpResponse.json({ data: null });
      }),
    );
  });

  it("renders nothing when bug is null", () => {
    render(
      <BugApprovalModal
        show={true}
        bug={null}
        onHide={mockOnHide}
        onConfirmApprove={mockOnConfirmApprove}
        repos={sampleRepos}
        categories={sampleCategories}
      />,
    );
    expect(screen.queryByText("Review and Approve Local Bug")).not.toBeInTheDocument();
  });

  it("renders nothing when show is false", () => {
    render(
      <BugApprovalModal
        show={false}
        bug={sampleBug}
        onHide={mockOnHide}
        onConfirmApprove={mockOnConfirmApprove}
        repos={sampleRepos}
        categories={sampleCategories}
      />,
    );
    expect(screen.queryByText("Review and Approve Local Bug")).not.toBeInTheDocument();
  });

  it("renders correctly with bug details", () => {
    render(
      <BugApprovalModal
        show={true}
        bug={sampleBug}
        onHide={mockOnHide}
        onConfirmApprove={mockOnConfirmApprove}
        repos={sampleRepos}
        categories={sampleCategories}
      />,
    );

    expect(screen.getByText("Review and Approve Local Bug")).toBeInTheDocument();
    expect(screen.getByLabelText(/Title \*/i)).toHaveValue("Old Title");
    expect(screen.getByLabelText(/Description \*/i)).toHaveValue("Old Description");
    expect(screen.getByLabelText(/Target Repository/i)).toHaveValue("repo1");
    expect(screen.getByLabelText(/Priority \*/i)).toHaveValue("low");
    expect(screen.getByLabelText(/Category \*/i)).toHaveValue("UI");

    // Check attachment rendered
    expect(screen.getByText("att1.jpg (image/jpeg)")).toBeInTheDocument();
  });

  it("requires title, description, and githubRepo on submit", async () => {
    render(
      <BugApprovalModal
        show={true}
        bug={sampleBug}
        onHide={mockOnHide}
        onConfirmApprove={mockOnConfirmApprove}
        repos={sampleRepos}
        categories={sampleCategories}
      />,
    );

    // Empty fields
    const user = userEvent.setup();
    await user.clear(screen.getByLabelText(/Title \*/i));
    await user.clear(screen.getByLabelText(/Description \*/i));
    await user.selectOptions(screen.getByLabelText(/Target Repository/i), "");

    fireEvent.submit(screen.getByRole("button", { name: "Approve & Send to GitHub" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(await screen.findByText("Description is required")).toBeInTheDocument();
    expect(await screen.findByText("GitHub repository is required")).toBeInTheDocument();
    expect(mockOnConfirmApprove).not.toHaveBeenCalled();
  });

  it("submits the form successfully and calls onConfirmApprove", async () => {
    mockOnConfirmApprove.mockResolvedValueOnce(undefined);

    render(
      <BugApprovalModal
        show={true}
        bug={sampleBug}
        onHide={mockOnHide}
        onConfirmApprove={mockOnConfirmApprove}
        repos={sampleRepos}
        categories={sampleCategories}
      />,
    );

    // Update some values
    const user = userEvent.setup();
    await user.clear(screen.getByLabelText(/Title \*/i));
    await user.type(screen.getByLabelText(/Title \*/i), "Approved Title");
    await user.type(screen.getByLabelText(/Status Change Comment/i), "Review note");

    fireEvent.submit(screen.getByRole("button", { name: "Approve & Send to GitHub" }));

    await waitFor(() => {
      expect(mockOnConfirmApprove).toHaveBeenCalledWith(
        "bug-123",
        "open",
        "Review note",
        "Approved Title",
        "Old Description",
        "low",
        "UI",
        "repo1",
      );
    });

    await waitFor(() => {
      expect(mockOnHide).toHaveBeenCalledTimes(1);
    });
  });

  it("handles file upload successfully", async () => {
    render(
      <BugApprovalModal
        show={true}
        bug={sampleBug}
        onHide={mockOnHide}
        onConfirmApprove={mockOnConfirmApprove}
        repos={sampleRepos}
        categories={sampleCategories}
      />,
    );

    const file = new File(["foo"], "att2.png", { type: "image/png" });
    const fileInput = screen.getByLabelText(/Add Attachment/i) as HTMLInputElement;

    // Trigger upload
    const user = userEvent.setup();
    await user.upload(fileInput, file);

    expect(uploadAttachmentParams[0]).toEqual({ bugId: "bug-123" });

    // New attachment should appear in document
    await screen.findByText("att2.png (image/png)");
  });

  it("handles file deletion successfully", async () => {
    render(
      <BugApprovalModal
        show={true}
        bug={sampleBug}
        onHide={mockOnHide}
        onConfirmApprove={mockOnConfirmApprove}
        repos={sampleRepos}
        categories={sampleCategories}
      />,
    );

    const user = userEvent.setup();
    const deleteBtn = screen.getByRole("button", { name: "" }); // the trash button
    await user.click(deleteBtn);

    expect(deleteAttachmentParams[0]).toBe("1");

    await waitFor(() => {
      expect(screen.queryByText("att1.jpg (image/jpeg)")).not.toBeInTheDocument();
    });
  });

  it("shows error alert if upload or deletion fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    server.use(
      http.post(apiTarget("/bugs/:bugId/attachments"), () => {
        return HttpResponse.json(
          { errorCode: 400, message: "Server error occurred" },
          { status: 400 },
        );
      }),
    );

    render(
      <BugApprovalModal
        show={true}
        bug={sampleBug}
        onHide={mockOnHide}
        onConfirmApprove={mockOnConfirmApprove}
        repos={sampleRepos}
        categories={sampleCategories}
      />,
    );

    const file = new File(["foo"], "att2.png", { type: "image/png" });
    const fileInput = screen.getByLabelText(/Add Attachment/i) as HTMLInputElement;

    const user = userEvent.setup();
    await user.upload(fileInput, file);

    expect(await screen.findByText("Server error occurred")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
