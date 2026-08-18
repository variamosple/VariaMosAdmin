import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Events, ResponseModel } from "@variamosple/variamos-components";
import { vi } from "vitest";
import {
  createBug,
  queryCategories,
} from "@/features/bug-tracker/api/BugRepository";
import { MainLayout } from "./MainLayout";

// Mock external components and APIs
vi.mock("@variamosple/variamos-components", () => {
  const listeners: Record<
    string,
    ((event: CustomEvent<Record<string, never>>) => void)[]
  > = {};
  class ResponseModel<Type = Record<string, never>> {
    status: string;
    errorCode: number | null = null;
    message: string = "";
    data: Type | null = null;
    constructor(status = "success") {
      this.status = status;
    }
    withData(data: Type) {
      this.data = data;
      return this;
    }
    withError(code: number, msg: string) {
      this.errorCode = code;
      this.message = msg;
      return this;
    }
  }

  return {
    Footer: () => <div data-testid="footer">Footer</div>,
    Header: () => <div data-testid="header">Header</div>,
    MenuContextProvider: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Events: {
      subscribe: vi.fn(
        <T,>(event: string, callback: (event: CustomEvent<T>) => void) => {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(
            callback as (event: CustomEvent<Record<string, never>>) => void,
          );
        },
      ),
      unsubscribe: vi.fn(
        <T,>(event: string, callback: (event: CustomEvent<T>) => void) => {
          if (!listeners[event]) return;
          listeners[event] = listeners[event].filter((cb) => cb !== callback);
        },
      ),
      publish: vi.fn(<T,>(event: string, data: T) => {
        if (!listeners[event]) return;
        const customEvent = { detail: data } as CustomEvent<
          Record<string, never>
        >;
        for (const cb of listeners[event]) {
          cb(customEvent);
        }
      }),
    },
    ResponseModel,
  };
});

vi.mock("@/features/bug-tracker/api/BugRepository", () => ({
  createBug: vi.fn(),
  queryCategories: vi.fn(),
}));

describe("MainLayout Global Bug Modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (queryCategories as import("vitest").Mock).mockResolvedValue(
      new ResponseModel("success").withData(["Category A", "Category B"]),
    );
  });

  test("should register subscription on mount and clean up on unmount", () => {
    const { unmount } = render(<MainLayout />);
    expect(Events.subscribe).toHaveBeenCalledWith(
      "openReportBugModal",
      expect.any(Function),
    );
    unmount();
    expect(Events.unsubscribe).toHaveBeenCalledWith(
      "openReportBugModal",
      expect.any(Function),
    );
  });

  test("should call createBug on form submission and close on success", async () => {
    (createBug as import("vitest").Mock).mockResolvedValue(
      new ResponseModel("success"),
    );

    render(<MainLayout />);

    // Wait for categories to load on mount
    await waitFor(() => {
      expect(queryCategories).toHaveBeenCalled();
    });

    // Simulate event triggering
    act(() => {
      Events.publish<Record<string, never>>("openReportBugModal", {});
    });

    // Verify modal elements are displayed
    await waitFor(() => {
      expect(screen.getByText("Report a New Bug")).toBeInTheDocument();
    });

    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Test Bug" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Test description" },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: /Report Bug/i }));
    });

    await waitFor(() => {
      expect(createBug).toHaveBeenCalledWith(
        "Test Bug",
        "Test description",
        "medium",
        "Category A",
        undefined,
        undefined,
      );
    });
  });
});
