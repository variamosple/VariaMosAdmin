import { act, render, renderHook, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ToastProvider, useToast } from "./ToastContext";

const TestComponent = () => {
  const { pushToast, removeToast } = useToast();
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          pushToast({
            title: "Test Title",
            message: "Test Message",
            variant: "success",
          })
        }
      >
        Push Toast
      </button>
      <button type="button" onClick={() => removeToast("test-id")}>
        Remove Toast
      </button>
    </div>
  );
};

const _BadComponent = () => {
  useToast();
  return <div>Bad</div>;
};

// Pushes a success or an error toast (UX-22)
const Pusher = () => {
  const { pushToast } = useToast();
  return (
    <>
      <button
        type="button"
        onClick={() =>
          pushToast({ title: "Saved", message: "Done", variant: "success" })
        }
      >
        Success
      </button>
      <button
        type="button"
        onClick={() =>
          pushToast({ title: "Failed", message: "Oops", variant: "danger" })
        }
      >
        Error
      </button>
    </>
  );
};

describe("ToastContext & useToast", () => {
  it("throws error when used outside ToastProvider", () => {
    // Suppress console.error for clean output during expected throw
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Intercept and prevent JSDOM from logging the expected uncaught error
    const errorHandler = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes(
          "useToast must be used within a ToastProvider",
        )
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("error", errorHandler);

    expect(() => renderHook(() => useToast())).toThrow(
      "useToast must be used within a ToastProvider",
    );

    window.removeEventListener("error", errorHandler);
    spy.mockRestore();
  });

  it("adds and displays a toast when pushToast is called", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    const button = screen.getByText("Push Toast");
    act(() => {
      button.click();
    });

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Message")).toBeInTheDocument();
  });

  it("removes a toast when clicking the close button", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("Push Toast").click();
    });

    expect(screen.getByText("Test Title")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /close/i });
    act(() => {
      closeButton.click();
    });

    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
  });

  describe("hiding (UX-22)", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("hides a success after 5 s but keeps an error until it is closed", () => {
      vi.useFakeTimers();
      render(
        <ToastProvider>
          <Pusher />
        </ToastProvider>,
      );

      act(() => {
        screen.getByText("Success").click();
        screen.getByText("Error").click();
      });
      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      expect(screen.queryByText("Saved")).not.toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });
  });
});
