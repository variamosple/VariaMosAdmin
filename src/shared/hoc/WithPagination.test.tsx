import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { withPagination, PaginationControlsProps } from "./WithPagination";

// Simple dummy component that receives the pagination props
const DummyComponent: React.FC<PaginationControlsProps & { title: string }> = ({
  currentPage,
  totalPages,
  onPageChange,
  title,
}) => {
  return (
    <div>
      <h1>{title}</h1>
      <span data-testid="current-page">{currentPage}</span>
      <span data-testid="total-pages">{totalPages}</span>
      <button data-testid="btn-next" onClick={() => onPageChange(currentPage + 1)}>
        Next
      </button>
      <button data-testid="btn-prev" onClick={() => onPageChange(currentPage - 1)}>
        Prev
      </button>
      <button data-testid="btn-invalid" onClick={() => onPageChange(99)}>
        Go to 99
      </button>
    </div>
  );
};

const Wrapped = withPagination(DummyComponent);

describe("withPagination HOC", () => {
  it("should transmit pagination props and render title correctly", () => {
    render(<Wrapped title="Test Title" totalItems={25} pageSize={10} />);

    expect(screen.getByRole("heading", { name: "Test Title" })).toBeInTheDocument();
    expect(screen.getByTestId("current-page")).toHaveTextContent("1");
    expect(screen.getByTestId("total-pages")).toHaveTextContent("3");
  });

  it("should change page correctly within limits", async () => {
    const user = userEvent.setup();
    render(<Wrapped title="Test" totalItems={25} pageSize={10} />);

    const nextPageBtn = screen.getByTestId("btn-next");
    const prevPageBtn = screen.getByTestId("btn-prev");

    // Click next -> page 2
    await user.click(nextPageBtn);
    expect(screen.getByTestId("current-page")).toHaveTextContent("2");

    // Click next -> page 3
    await user.click(nextPageBtn);
    expect(screen.getByTestId("current-page")).toHaveTextContent("3");

    // Click next again -> should remain page 3 (upper boundary check)
    await user.click(nextPageBtn);
    expect(screen.getByTestId("current-page")).toHaveTextContent("3");

    // Click prev -> page 2
    await user.click(prevPageBtn);
    expect(screen.getByTestId("current-page")).toHaveTextContent("2");

    // Click prev -> page 1
    await user.click(prevPageBtn);
    expect(screen.getByTestId("current-page")).toHaveTextContent("1");

    // Click prev again -> should remain page 1 (lower boundary check)
    await user.click(prevPageBtn);
    expect(screen.getByTestId("current-page")).toHaveTextContent("1");
  });

  it("should not jump to out of bounds page numbers", async () => {
    const user = userEvent.setup();
    render(<Wrapped title="Test" totalItems={25} pageSize={10} />);

    const invalidBtn = screen.getByTestId("btn-invalid");
    await user.click(invalidBtn);
    expect(screen.getByTestId("current-page")).toHaveTextContent("1"); // remains 1
  });

  it("should default pageSize to 10 and initialPage to 1", () => {
    render(<Wrapped title="Test" totalItems={15} />);
    expect(screen.getByTestId("total-pages")).toHaveTextContent("2");
    expect(screen.getByTestId("current-page")).toHaveTextContent("1");
  });

  it("should adjust current page when total items shrink below the current page limits", () => {
    const { rerender } = render(
      <Wrapped title="Test" totalItems={35} pageSize={10} initialPage={4} />,
    );
    expect(screen.getByTestId("current-page")).toHaveTextContent("4");
    expect(screen.getByTestId("total-pages")).toHaveTextContent("4");

    // Rerender with only 5 items (totalPages becomes 1)
    rerender(<Wrapped title="Test" totalItems={5} pageSize={10} initialPage={4} />);
    expect(screen.getByTestId("total-pages")).toHaveTextContent("1");
    expect(screen.getByTestId("current-page")).toHaveTextContent("1");
  });
});
