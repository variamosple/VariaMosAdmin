import type { FC } from "react";
import { Alert, Button, Col, Form, Row, Spinner } from "react-bootstrap";

export interface RoleOption {
  id?: number;
  name: string;
}

export interface RoleCheckboxListProps {
  roles: RoleOption[];
  /** How many roles exist, when only the first ones were loaded. */
  total: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  selected: string[];
  onToggle: (roleName: string) => void;
  /** Makes the checkbox ids unique when two lists share a page. */
  idPrefix?: string;
}

/** Roles to choose as the audience of a message, by name. */
export const RoleCheckboxList: FC<RoleCheckboxListProps> = ({
  roles,
  total,
  loading,
  error,
  onRetry,
  selected,
  onToggle,
  idPrefix = "role",
}) => (
  <>
    {loading && (
      <div className="text-muted d-flex align-items-center gap-2">
        <Spinner animation="border" size="sm" /> Loading roles...
      </div>
    )}
    {error && (
      <Alert variant="danger" className="py-2 d-flex align-items-center gap-2">
        <span>{error}</span>
        <Button
          size="sm"
          variant="outline-danger"
          className="ms-auto"
          onClick={onRetry}
        >
          Retry
        </Button>
      </Alert>
    )}
    {total > roles.length && (
      <p className="small text-muted">
        Only the first {roles.length} of {total} roles are listed.
      </p>
    )}
    <Row xs={1} sm={2} className="g-2">
      {roles.map((role) => (
        <Col key={role.id ?? role.name}>
          <Form.Check
            type="checkbox"
            id={`${idPrefix}-${role.id ?? role.name}`}
            label={role.name}
            checked={selected.includes(role.name)}
            onChange={() => onToggle(role.name)}
          />
        </Col>
      ))}
    </Row>
  </>
);
