import { screen } from "@testing-library/react";
import { createContext, type ReactNode, useContext, useState } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/shared/context/ToastContext";
import { renderPage, renderWithUser } from "./render";

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
};

const Theme = createContext("light");
const ThemeName = () => <p>{useContext(Theme)}</p>;

const Address = () => {
  const { pathname, search } = useLocation();
  return <p>{pathname + search}</p>;
};

const SaveButton = () => {
  const { pushToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => pushToast({ title: "Saved", message: "All good" })}
    >
      Save
    </button>
  );
};

describe("renderWithUser", () => {
  it("returns a user whose clicks reach the component", async () => {
    const { user } = renderWithUser(<Counter />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("Clicked 1 times");
  });

  it("passes the options of render through, the wrapper among them", () => {
    renderWithUser(<ThemeName />, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <Theme.Provider value="dark">{children}</Theme.Provider>
      ),
    });

    expect(screen.getByText("dark")).toBeInTheDocument();
  });

  it("passes its own options to userEvent, so that it can run with fake timers", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const advanceTimers = vi.fn(vi.advanceTimersByTime);
      const { user } = renderWithUser(<Counter />, {
        userEventOptions: { advanceTimers },
      });

      await user.click(screen.getByRole("button"));

      expect(screen.getByRole("button")).toHaveTextContent("Clicked 1 times");
      expect(advanceTimers).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("renderPage", () => {
  it("starts the router at the given address", () => {
    renderPage(<Address />, { route: "/users?search=jane" });

    expect(screen.getByText("/users?search=jane")).toBeInTheDocument();
  });

  it("starts the router at the root by default", () => {
    renderPage(<Address />);

    expect(screen.getByText("/")).toBeInTheDocument();
  });

  it("shows the toasts the page pushes", async () => {
    const { user } = renderPage(<SaveButton />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("All good")).toBeInTheDocument();
  });
});
