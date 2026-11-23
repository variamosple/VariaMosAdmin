import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { MainLayout } from "./MainLayout";

vi.mock("@variamosple/variamos-components", () => ({
  DEFAULT_MAIN_CONTENT_ID: "main-content",
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

  // ADM-N15: the skip link of the header focuses this landmark
  test("puts the page in a main landmark the skip link can focus", () => {
    render(
      <MainLayout>
        <div data-testid="child-content">Child Content</div>
      </MainLayout>,
    );

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toContainElement(screen.getByTestId("child-content"));
    expect(main).not.toContainElement(screen.getByTestId("footer"));
  });
});
