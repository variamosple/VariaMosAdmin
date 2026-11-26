import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useUnsavedInput } from "@variamosple/variamos-components";
import { useState } from "react";
import {
  createMemoryRouter,
  Link,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { LeaveGuard } from ".";

const NoteForm = () => {
  const [note, setNote] = useState("");
  useUnsavedInput(note.trim() !== "");
  return (
    <label>
      Note
      <input value={note} onChange={(e) => setNote(e.target.value)} />
    </label>
  );
};

const renderPages = () => {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <LeaveGuard />
            <nav>
              <Link to="/roles">Roles</Link>
              <Link to="/notes?search=x">Search</Link>
              <Link to="/login">Sign in</Link>
            </nav>
            <Outlet />
          </>
        ),
        children: [
          { path: "/home", element: <p>Home page</p> },
          { path: "/notes", element: <NoteForm /> },
          { path: "/roles", element: <p>Roles page</p> },
          { path: "/login", element: <p>Login page</p> },
        ],
      },
    ],
    { initialEntries: ["/home", "/notes"], initialIndex: 1 },
  );
  render(<RouterProvider router={router} />);
  return router;
};

const typeNote = () =>
  userEvent.type(screen.getByLabelText("Note"), "Half a role");

describe("LeaveGuard", () => {
  it("leaves a page without input at once", async () => {
    renderPages();
    await userEvent.click(screen.getByRole("link", { name: "Roles" }));
    expect(screen.getByText("Roles page")).toBeInTheDocument();
  });

  it("asks before a link leaves a page with input, and keeps it", async () => {
    renderPages();
    await typeNote();

    await userEvent.click(screen.getByRole("link", { name: "Roles" }));
    const question = await screen.findByRole("dialog");
    expect(question).toHaveTextContent("Discard your input?");
    // The answer that loses nothing has the focus
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Keep editing" }),
      ).toHaveFocus(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Note")).toHaveValue("Half a role");

    await userEvent.click(screen.getByRole("link", { name: "Roles" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Discard" }),
    );
    expect(await screen.findByText("Roles page")).toBeInTheDocument();
  });

  it("asks before the back button leaves a page with input", async () => {
    const router = renderPages();
    await typeNote();

    await act(() => router.navigate(-1));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(router.state.location.pathname).toBe("/notes");
    expect(screen.getByLabelText("Note")).toHaveValue("Half a role");
  });

  it("keeps the page when only its search changes, and lets sign-in go", async () => {
    const router = renderPages();
    await typeNote();

    await userEvent.click(screen.getByRole("link", { name: "Search" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.state.location.search).toBe("?search=x");
    expect(screen.getByLabelText("Note")).toHaveValue("Half a role");

    await userEvent.click(screen.getByRole("link", { name: "Sign in" }));
    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });
});
