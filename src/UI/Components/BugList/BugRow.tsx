import { Bug } from "@/Domain/Bug/Bug";
import { formatDate } from "@/UI/constants";
import { FC } from "react";
import { Badge, Button } from "react-bootstrap";
import { Eye } from "react-bootstrap-icons";

interface BugRowProps {
  bug: Bug;
  onViewDetails: (bug: Bug) => void;
  activeTab?: "github" | "local" | "trash";
  onReject?: (id: string) => void;
  onRestore?: (id: string) => void;
  onApprove?: (bug: Bug) => void;
}

export const BugRowComponent: FC<BugRowProps> = ({
  bug,
  onViewDetails,
  activeTab = "github",
  onReject,
  onRestore,
  onApprove,
}) => {
  // Helper for priority badges colors
  const getPriorityBadge = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return <Badge bg="danger">High</Badge>;
      case "medium":
        return (
          <Badge bg="warning" text="dark">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge bg="info" text="dark">
            Low
          </Badge>
        );
      default:
        return <Badge bg="secondary">{priority || "None"}</Badge>;
    }
  };

  // Helper for status badges colors
  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return <Badge bg="success">Open</Badge>;
      case "closed":
        return <Badge bg="secondary">Closed</Badge>;
      default:
        return (
          <Badge bg="light" text="dark">
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  const githubUrl =
    bug.githubRepo && bug.gitIssueNumber
      ? `https://github.com/${bug.githubRepo}/issues/${bug.gitIssueNumber}`
      : undefined;

  return (
    <tr key={bug.id}>
      <td className="align-middle">
        {githubUrl ? (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none font-monospace"
          >
            #{bug.gitIssueNumber}
          </a>
        ) : (
          <span className="text-muted font-monospace">
            {bug.id ? `#${bug.id.substring(0, 8)}...` : "N/A"}
          </span>
        )}
      </td>

      <td
        className="align-middle font-weight-bold text-dark"
        style={{ minWidth: "150px" }}
      >
        {bug.title}
      </td>

      <td
        className="align-middle text-muted small"
        title={bug.description}
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "200px",
        }}
      >
        {bug.description}
      </td>

      <td className="align-middle small">
        <Badge bg="dark" className="text-light">
          {bug.githubRepo || "Local"}
        </Badge>
      </td>

      <td className="align-middle">{getPriorityBadge(bug.priority)}</td>

      <td className="align-middle">{getStatusBadge(bug.status)}</td>

      <td className="align-middle small">
        <div>
          {bug.githubCreator
            ? `@${bug.githubCreator}`
            : bug.createdBy?.name || bug.reporterEmail || "Guest"}
        </div>
        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
          {bug.createdAt ? formatDate(new Date(bug.createdAt)) : "N/A"}
        </div>
      </td>

      {activeTab !== "github" && (
        <td className="align-middle">
          {bug.attachments && bug.attachments.length > 0 ? (
            <a
              href={`${process.env.REACT_APP_ADMIN_API_URL || "http://localhost:4000"}${bug.attachments[0].filePath}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Attachment
            </a>
          ) : (
            <span className="text-muted">No attachment</span>
          )}
        </td>
      )}

      <td className="align-middle text-center">
        <div className="d-flex justify-content-center gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onViewDetails(bug)}
            title="View details"
            style={{ minWidth: "85px" }}
          >
            <Eye size={16} className="me-1" /> Details
          </Button>

          {activeTab === "local" && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => onApprove?.(bug)}
                title="Approve"
                style={{ minWidth: "80px" }}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => bug.id && onReject?.(bug.id)}
                title="Reject"
                style={{ minWidth: "80px" }}
              >
                Reject
              </Button>
            </>
          )}

          {activeTab === "trash" && (
            <Button
              variant="warning"
              size="sm"
              onClick={() => bug.id && onRestore?.(bug.id)}
              title="Restore"
              style={{ minWidth: "80px" }}
            >
              Restore
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
