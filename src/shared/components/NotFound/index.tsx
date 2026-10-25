import type { FC } from "react";
import { Container } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";

/**
 * Shown for an address that matches no page, instead of a silent jump to
 * the home page (UX-25). A missing right has its own page, /403.
 */
export const NotFound: FC = () => {
  const { pathname } = useLocation();

  return (
    <Container className="d-flex flex-column justify-content-center align-items-center py-5 text-center">
      <p className="display-1 fw-bold text-secondary mb-0" aria-hidden="true">
        404
      </p>
      <h1 className="h3">Page not found</h1>
      <p className="text-muted">
        There is no page at <code>{pathname}</code>. The link may be wrong, or
        the page may have moved.
      </p>
      <Link className="btn btn-primary" to="/">
        Go to the home page
      </Link>
    </Container>
  );
};
