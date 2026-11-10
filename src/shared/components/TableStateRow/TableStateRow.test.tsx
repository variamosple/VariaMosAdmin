import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ListState } from "@/shared/hooks/usePagedList";
import { TableStateRow } from "./index";

const state = (overrides: Partial<ListState> = {}): ListState => ({
  isLoading: false,
  error: null,
  onRetry: vi.fn(),
  isFiltered: false,
  ...overrides,
});

const renderRow = (rowState: ListState, isEmpty: boolean) =>
  render(
    <table>
      <tbody>
        <TableStateRow
          state={rowState}
          isEmpty={isEmpty}
          colSpan={4}
          items="roles"
        />
      </tbody>
    </table>,
  );

describe("TableStateRow", () => {
  it("shows the first load", () => {
    renderRow(state({ isLoading: true }), true);
    expect(screen.getByText("Loading roles...")).toBeInTheDocument();
    expect(screen.getByRole("cell")).toHaveAttribute("colspan", "4");
  });

  it("shows a failed load with a Retry button, even over old items", async () => {
    const onRetry = vi.fn();
    renderRow(state({ error: "The roles could not be read.", onRetry }), false);

    expect(
      screen.getByText("The roles could not be read."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("tells an empty list from a search without match", () => {
    const { rerender } = renderRow(state(), true);
    expect(screen.getByText("No roles yet.")).toBeInTheDocument();

    rerender(
      <table>
        <tbody>
          <TableStateRow
            state={state({ isFiltered: true })}
            isEmpty
            colSpan={4}
            items="roles"
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText("No roles match the search.")).toBeInTheDocument();
  });

  it("shows nothing once there are items, even while a page loads", () => {
    renderRow(state({ isLoading: true }), false);
    expect(screen.queryByRole("row")).not.toBeInTheDocument();
  });
});
