import React from "react";
import { render, screen } from "@testing-library/react";
import { UserDetails } from "./index";
import { User } from "../../domain/Entity/User";
import "@testing-library/jest-dom";

const mockUser: User = {
  id: "user-123",
  name: "John Doe",
  user: "johndoe",
  email: "john@example.com",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  lastLogin: new Date("2026-01-02T15:30:00Z"),
  isDeleted: false,
  isEnabled: true,
};

describe("UserDetails Component", () => {
  it("renders user information correctly", () => {
    render(<UserDetails user={mockUser} />);

    expect(screen.getByText("user-123")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("johndoe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders status as disabled when not enabled and not deleted", () => {
    const disabledUser = { ...mockUser, isEnabled: false };
    render(<UserDetails user={disabledUser} />);
    expect(screen.getByText("disabled")).toBeInTheDocument();
  });

  it("renders status as deleted when isDeleted is true", () => {
    const deletedUser = { ...mockUser, isDeleted: true };
    render(<UserDetails user={deletedUser} />);
    expect(screen.getByText("deleted")).toBeInTheDocument();
  });

  it("renders N/A for last login if not present", () => {
    const userWithoutLogin = { ...mockUser, lastLogin: undefined };
    render(<UserDetails user={userWithoutLogin} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});
