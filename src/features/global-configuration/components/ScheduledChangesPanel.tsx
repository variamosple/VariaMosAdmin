import type { FC } from "react";
import { Alert, Badge, Button, Card, ListGroup } from "react-bootstrap";
import { describeInstant } from "@/shared/domain/TimeZone";
import {
  describeValue,
  formatUtc,
  type ScheduledChange,
  STATUS_LABELS,
} from "../domain/Entity/ScheduledChange";

export interface ScheduledChangesPanelProps {
  changes: ScheduledChange[];
  error: string | null;
  /** The signed-in account, to say "you" for its own changes. */
  userId?: string;
  /** False hides Edit and Cancel, which the server would refuse. */
  canUpdate: boolean;
  /** The time zone of the profile, or the browser's, shown beside UTC. */
  timeZone?: string;
  onEdit: (change: ScheduledChange) => void;
  onCancel: (change: ScheduledChange) => void;
}

const authorOf = (change: ScheduledChange, userId?: string) =>
  change.createdBy === userId ? "you" : "another administrator";

/**
 * The changes planned for later, then those resolved lately with what
 * became of them (EV-115 lot B). Nothing is shown when there are none.
 */
export const ScheduledChangesPanel: FC<ScheduledChangesPanelProps> = ({
  changes,
  error,
  userId,
  canUpdate,
  timeZone = "UTC",
  onEdit,
  onCancel,
}) => {
  if (error) {
    return (
      <Alert variant="warning" className="py-2 small">
        {error}
      </Alert>
    );
  }
  if (changes.length === 0) return null;
  const planned = changes.filter((c) => c.status === "scheduled");
  const resolved = changes.filter((c) => c.status !== "scheduled");

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header as="h2" className="fs-6 fw-bold mb-0">
        Planned changes
      </Card.Header>
      <ListGroup variant="flush">
        {planned.length === 0 && (
          <ListGroup.Item className="text-muted small">
            No change is planned.
          </ListGroup.Item>
        )}
        {planned.map((change) => (
          <ListGroup.Item
            key={change.id}
            className="d-flex flex-wrap align-items-center gap-2"
          >
            <div className="me-auto">
              <div>
                <span className="fw-semibold">{change.key}</span>:{" "}
                {describeValue(change.previousValue)} →{" "}
                <strong>{describeValue(change.newValue)}</strong> on{" "}
                {describeInstant(new Date(change.dueAt), timeZone)}
              </div>
              <div className="text-muted small">
                Planned by {authorOf(change, userId)}
              </div>
            </div>
            {canUpdate && (
              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => onEdit(change)}
                  aria-label={`Edit the planned change of ${change.key}`}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onCancel(change)}
                  aria-label={`Cancel the planned change of ${change.key}`}
                >
                  Cancel
                </Button>
              </div>
            )}
          </ListGroup.Item>
        ))}
        {resolved.length > 0 && (
          <ListGroup.Item className="bg-light small fw-semibold text-muted">
            Last 30 days
          </ListGroup.Item>
        )}
        {resolved.map((change) => (
          <ListGroup.Item key={change.id} className="small">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <Badge bg={STATUS_LABELS[change.status].variant}>
                {STATUS_LABELS[change.status].label}
              </Badge>
              <span>
                <span className="fw-semibold">{change.key}</span>:{" "}
                {describeValue(change.previousValue)} →{" "}
                {describeValue(change.newValue)}, planned for{" "}
                {formatUtc(change.dueAt)}
              </span>
            </div>
            {change.reason && (
              <div className="text-muted mt-1">{change.reason}</div>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
};
