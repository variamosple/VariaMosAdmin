import { type RenderOptions, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/shared/context/ToastContext";

type UserEventOptions = Parameters<typeof userEvent.setup>[0];

export type RenderWithUserOptions = RenderOptions & {
  /** Passed to `userEvent.setup()`, e.g. `{ advanceTimers: vi.advanceTimersByTime }` */
  userEventOptions?: UserEventOptions;
};

/**
 * Renders the component and sets up `userEvent` before it, as Testing
 * Library recommends: `const { user } = renderWithUser(<Form />)`, then
 * `await user.click(...)`. Every option of `render` is passed through.
 */
export const renderWithUser = (
  ui: ReactElement,
  { userEventOptions, ...options }: RenderWithUserOptions = {},
) => {
  const user = userEvent.setup(userEventOptions);
  return { user, ...render(ui, options) };
};

export type RenderPageOptions = Omit<RenderWithUserOptions, "wrapper"> & {
  /** The address the router starts at, query string included */
  route?: string;
};

/**
 * Renders a page as the application shows it: inside a router, which starts
 * at `route`, and the toast provider, whose messages appear on screen.
 */
export const renderPage = (
  ui: ReactElement,
  { route = "/", ...options }: RenderPageOptions = {},
) =>
  renderWithUser(ui, {
    ...options,
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>{children}</ToastProvider>
      </MemoryRouter>
    ),
  });
