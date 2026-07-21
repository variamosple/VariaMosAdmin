import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HomePage } from "./Home";

describe("HomePage Component", () => {
  it("renders welcoming text and VariaMos heading", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "VariaMos" })).toBeInTheDocument();
    expect(screen.getByText(/Welcome to the VariaMos admin module/i)).toBeInTheDocument();
  });
});
