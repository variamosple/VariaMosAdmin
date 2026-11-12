import type { FC } from "react";
import { Badge, Col, Row } from "react-bootstrap";
import { DateTime } from "@/shared/components/DateTime";
import { attachmentUrl } from "../../api/attachmentUrl";
import type { Bug } from "../../domain/Bug";
import { componentLabel } from "../../domain/BugComponent";
import { BugPriorityBadge } from "../BugPriorityBadge";
import { BugStatusBadge } from "../BugStatusBadge";

const BugHeading: FC<{ bug: Bug }> = ({ bug }) => (
  <div className="d-flex justify-content-between align-items-center mb-3">
    <h4 className="mb-0">{bug.title}</h4>
    <div className="d-flex gap-2">
      <Badge bg="dark" className="text-light">
        {bug.githubRepo || "Local"}
      </Badge>
      {bug.priority ? <BugPriorityBadge priority={bug.priority} /> : null}
      {bug.status ? <BugStatusBadge status={bug.status} /> : null}
    </div>
  </div>
);

const BugDescription: FC<{ bug: Bug }> = ({ bug }) => (
  <div className="mb-4">
    <h6 className="text-muted">Description</h6>
    <div
      className="bg-light p-3 rounded text-dark font-sans-serif"
      style={{
        whiteSpace: "pre-wrap",
        maxHeight: "300px",
        overflowY: "auto",
        border: "1px solid #dee2e6",
      }}
    >
      {bug.description}
    </div>
  </div>
);

const creatorOf = (bug: Bug): string =>
  bug.githubCreator ? `@${bug.githubCreator}` : bug.createdBy?.name || "System";

const BugFacts: FC<{ bug: Bug }> = ({ bug }) => (
  <>
    <Row className="mb-3">
      <Col md={6} className="mb-2 mb-md-0">
        <strong>Category: </strong> {bug.category}
        <br />
        <strong>Component: </strong> {componentLabel(bug.component)}
      </Col>
      <Col md={6}>
        <strong>Created At: </strong> <DateTime value={bug.createdAt} />
      </Col>
    </Row>

    <Row className="mb-3">
      <Col md={6} className="mb-2 mb-md-0">
        <strong>Creator: </strong> {creatorOf(bug)}
      </Col>
      <Col md={6}>
        <strong>Reporter Email: </strong>{" "}
        {bug.reporterEmail || bug.createdBy?.email || "N/A"}
      </Col>
    </Row>

    <Row className="mb-3">
      <Col>
        <strong>Assigned to: </strong>{" "}
        {bug.assignedAdmins?.length
          ? bug.assignedAdmins.map((user) => user.name).join(", ")
          : "Nobody"}
      </Col>
    </Row>
  </>
);

const GitHubLink: FC<{ repo: string; issueNumber: number }> = ({
  repo,
  issueNumber,
}) => (
  <div
    className="mb-3 bg-light p-2 rounded"
    style={{ border: "1px dashed #ced4da" }}
  >
    <strong>GitHub Link: </strong>
    <a
      href={`https://github.com/${repo}/issues/${issueNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-decoration-none ms-1 font-monospace"
    >
      {repo}#{issueNumber}
    </a>
  </div>
);

const Attachments: FC<{ bug: Bug }> = ({ bug }) => (
  <div className="mb-3">
    <strong>Attachments:</strong>
    <ul className="mt-1 mb-0 ps-3">
      {bug.attachments?.map((attachment) => (
        <li key={attachment.id} className="my-1">
          <a
            href={attachmentUrl(attachment.filePath)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none"
          >
            View Attachment (Type: {attachment.fileType || "unknown"})
          </a>
        </li>
      ))}
    </ul>
  </div>
);

/** What a bug says: its fields, its GitHub issue and its attachments. */
export const BugSummary: FC<{ bug: Bug }> = ({ bug }) => (
  <>
    <BugHeading bug={bug} />
    <BugDescription bug={bug} />
    <BugFacts bug={bug} />
    {bug.githubRepo && bug.gitIssueNumber ? (
      <GitHubLink repo={bug.githubRepo} issueNumber={bug.gitIssueNumber} />
    ) : null}
    {bug.attachments && bug.attachments.length > 0 ? (
      <Attachments bug={bug} />
    ) : null}
  </>
);
