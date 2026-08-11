import { act, render, renderHook, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ToastProvider, useToast } from "./ToastContext";

const TestComponent = () => {
  const { pushToast, removeToast } = useToast();
  return (
    <div>
      <button
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
      <button onClick={() => removeToast("test-id")}>Remove Toast</button>
    </div>
  );
};

const _BadComponent = () => {
  useToast();
  return <div>Bad</div>;
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
});
