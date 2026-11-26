import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  type BugReportPrefill,
  Events,
} from "@variamosple/variamos-components";
import { PageErrorBoundary } from "./index";

const Broken = () => {
  throw new Error("render failed");
};

describe("PageErrorBoundary (ADM-N43)", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React reports the caught error too; the boundary logs its own line
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("shows its children while they render", () => {
    render(
      <PageErrorBoundary>
        <p>Page content</p>
      </PageErrorBoundary>,
    );

    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a message instead of a blank page, and logs the error", () => {
    render(
      <PageErrorBoundary>
        <Broken />
      </PageErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong on this page",
    );
    expect(
      screen.getByRole("link", { name: "Go to the home page" }),
    ).toHaveAttribute("href", "./");
    expect(consoleError).toHaveBeenCalledWith(
      "Page error:",
      expect.objectContaining({ message: "render failed" }),
      expect.any(String),
    );
  });

  it("reloads the page on request", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    render(
      <PageErrorBoundary>
        <Broken />
      </PageErrorBoundary>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Reload the page" }),
    );

    expect(reload).toHaveBeenCalledOnce();
  });

  it("clears the error when its key changes", () => {
    const { rerender } = render(
      <PageErrorBoundary resetKey="/broken">
        <Broken />
      </PageErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <PageErrorBoundary resetKey="/fine">
        <p>Other page</p>
      </PageErrorBoundary>,
    );

    expect(screen.getByText("Other page")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the message while the key stays the same", () => {
    const { rerender } = render(
      <PageErrorBoundary resetKey="/broken">
        <Broken />
      </PageErrorBoundary>,
    );

    rerender(
      <PageErrorBoundary resetKey="/broken">
        <p>Same page</p>
      </PageErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("opens the global bug form with the page and the error (ADM-N53)", async () => {
    const opened = vi.fn();
    const onOpen = (event: CustomEvent<BugReportPrefill>) =>
      opened(event.detail);
    Events.subscribe("openReportBugModal", onOpen);
    render(
      <PageErrorBoundary resetKey="/broken">
        <Broken />
      </PageErrorBoundary>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Report this problem" }),
    );

    expect(opened).toHaveBeenCalledWith({
      title: "A page stopped because of an error",
      description: expect.stringContaining("Error: render failed"),
    });
    Events.unsubscribe("openReportBugModal", onOpen);
  });
});
