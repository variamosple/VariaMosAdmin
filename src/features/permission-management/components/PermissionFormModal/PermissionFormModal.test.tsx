import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { PermissionFormModal } from "./index";

// Mock dependencies
jest.mock("@variamosple/variamos-components", () => {
  return {
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

describe("PermissionFormModal Component", () => {
  const mockOnPermissionSubmit = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    modalTitle: "Create Permission",
    showModal: true,
    onClose: mockOnClose,
    onPermissionSubmit: mockOnPermissionSubmit,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render modal with title and cancel/submit buttons", () => {
    render(<PermissionFormModal {...defaultProps} />);

    expect(screen.getByText("Create Permission", { selector: ".modal-title" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Permission name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create permission/i })).toBeInTheDocument();
  });

  it("should call onPermissionSubmit on form submission with valid input", async () => {
    mockOnPermissionSubmit.mockResolvedValue({ errorCode: null });

    render(<PermissionFormModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("Permission name");
    const user = userEvent.setup();
    await user.type(input, "READ_PRIVILEGE");

    const submitBtn = screen.getByRole("button", { name: /create permission/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockOnPermissionSubmit).toHaveBeenCalledWith({ name: "READ_PRIVILEGE" });
    });
  });

  it("should show validation error when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<PermissionFormModal {...defaultProps} />);

    const submitBtn = screen.getByRole("button", { name: /create permission/i });
    await user.click(submitBtn);

    expect(await screen.findByText("Permission name is required")).toBeInTheDocument();
    expect(mockOnPermissionSubmit).not.toHaveBeenCalled();
  });

  it("should handle default value when editing a permission", () => {
    const defaultValue = { id: 42, name: "WRITE_PRIVILEGE" };
    render(
      <PermissionFormModal
        {...defaultProps}
        defaultValue={defaultValue}
        modalTitle="Edit Permission"
        submitText="Edit permission"
      />,
    );

    expect(screen.getByText("Edit Permission", { selector: ".modal-title" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("WRITE_PRIVILEGE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit permission/i })).toBeInTheDocument();
  });

  it("should show spinner and disable buttons when isLoading is true", () => {
    render(<PermissionFormModal {...defaultProps} isLoading={true} />);

    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should call onClose and reset form when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<PermissionFormModal {...defaultProps} />);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
