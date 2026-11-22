import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Button } from "react-bootstrap";

interface PageErrorBoundaryProps {
  children?: ReactNode;
  /**
   * A change clears the error: the page address, so that going to another
   * page leaves the one that failed.
   */
  resetKey?: string;
}

interface PageErrorBoundaryState {
  failed: boolean;
}

/**
 * Catches an error thrown while a page renders, which unmounted the whole
 * application and left a blank page (ADM-N43). The error goes to the
 * console, as the other errors of the interface do. React gives no hook for
 * this: a boundary is still a class.
 */
export class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  public override state: PageErrorBoundaryState = { failed: false };

  public static getDerivedStateFromError(): PageErrorBoundaryState {
    return { failed: true };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Page error:", error, info.componentStack);
  }

  public override componentDidUpdate(previous: PageErrorBoundaryProps): void {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  public override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <Alert variant="danger" className="m-3" role="alert">
        <Alert.Heading as="h1" className="h4">
          Something went wrong on this page
        </Alert.Heading>
        <p>
          The page stopped because of an unexpected error. Reloading it often
          helps; if it happens again, tell the VariaMos team.
        </p>
        <div className="d-flex gap-2">
          <Button variant="danger" onClick={() => window.location.reload()}>
            Reload the page
          </Button>
          <a className="btn btn-outline-secondary" href="./">
            Go to the home page
          </a>
        </div>
      </Alert>
    );
  }
}
