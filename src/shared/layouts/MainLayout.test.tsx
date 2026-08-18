import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { MainLayout } from "./MainLayout";

vi.mock("@variamosple/variamos-components", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
  Header: () => <div data-testid="header">Header</div>,
  MenuContextProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("MainLayout Smoke Test", () => {
  test("renders layout elements and children", () => {
    render(
      <MainLayout>
        <div data-testid="child-content">Child Content</div>
      </MainLayout>,
    );

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });
});
