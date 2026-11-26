import { openBugReport } from "@variamosple/variamos-components";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Button } from "react-bootstrap";

interface PageErrorBoundaryProps {
  children?: ReactNode;
  /**
   * A change clears the error: the page address and its search, so that
   * going to another page, or changing a filter of this one, leaves the
   * error (ADM-N53).
   */
  resetKey?: string;
}

interface PageErrorBoundaryState {
  error: Error | null;
}

/** What the global bug form opens with: the page and its error. */
export const pageErrorReport = (error: Error) => ({
  title: "A page stopped because of an error",
  description: [
    `Page: ${window.location.hash || window.location.pathname}`,
    `Error: ${error.message}`,
    "",
    "What I was doing: ",
  ].join("\n"),
});

/**
 * Catches an error thrown while a page renders, which unmounted the whole
 * application and left a blank page (ADM-N43). The error goes to the
 * console, as the other errors of the interface do, and can be reported
 * with the global bug form, filled with the page and the error (ADM-N53).
 * React gives no hook for this: a boundary is still a class. Errors of
 * event handlers and of asynchronous code are not caught (React does not).
 */
export class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  public override state: PageErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { error };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Page error:", error, info.componentStack);
  }

  public override componentDidUpdate(previous: PageErrorBoundaryProps): void {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  public override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <Alert variant="danger" className="m-3" role="alert">
        <Alert.Heading as="h1" className="h4">
          Something went wrong on this page
        </Alert.Heading>
        <p>
          The page stopped because of an unexpected error. Reloading it often
          helps; if it happens again, report it to the VariaMos team.
        </p>
        <div className="d-flex gap-2">
          <Button variant="danger" onClick={() => window.location.reload()}>
            Reload the page
          </Button>
          <Button
            variant="outline-danger"
            onClick={() => openBugReport(pageErrorReport(error))}
          >
            Report this problem
          </Button>
          <a className="btn btn-outline-secondary" href="./">
            Go to the home page
          </a>
        </div>
      </Alert>
    );
  }
}
