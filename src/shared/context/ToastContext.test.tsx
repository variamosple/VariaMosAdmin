import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useToast, ToastProvider } from "./ToastContext";

const TestComponent = () => {
  const { pushToast, removeToast } = useToast();
  return (
    <div>
      <button
        onClick={() =>
          pushToast({ title: "Test Title", message: "Test Message", variant: "success" })
        }
      >
        Push Toast
      </button>
      <button onClick={() => removeToast("test-id")}>Remove Toast</button>
    </div>
  );
};

const BadComponent = () => {
  useToast();
  return <div>Bad</div>;
};

describe("ToastContext & useToast", () => {
  it("throws error when used outside ToastProvider", () => {
    // Suppress console.error for clean output during expected throw
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BadComponent />)).toThrow("useToast must be used within a ToastProvider");
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
