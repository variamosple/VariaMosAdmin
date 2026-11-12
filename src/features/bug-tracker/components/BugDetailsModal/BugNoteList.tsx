import type { FC } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { DateTime } from "@/shared/components/DateTime";
import type { BugStatusLog } from "../../domain/Bug";
import { keyedLines } from "../../domain/keyedLines";

/** A changed field of an audit note, written "* Label: old -> new". */
interface AuditChange {
  label: string;
  oldValue: string;
  newValue: string;
}

const auditChangeOf = (line: string): AuditChange | null => {
  if (!line.startsWith("* ")) return null;
  const content = line.slice(2);
  if (!content.includes(" -> ")) return null;
  const [left = "", right = ""] = content.split(" -> ");
  const colonIndex = left.indexOf(":");
  if (colonIndex === -1) return null;
  return {
    label: left.slice(0, colonIndex + 1),
    oldValue: left.slice(colonIndex + 1).trim(),
    newValue: right,
  };
};

const AuditChangeLine: FC<{ change: AuditChange }> = ({ change }) => (
  <div className="my-1 ps-2 border-start border-2 border-secondary-subtle d-flex flex-wrap align-items-center gap-1">
    <strong className="text-dark-emphasis me-1">{change.label}</strong>
    <span
      className="text-danger bg-danger-subtle px-1 rounded"
      style={{ fontSize: "0.75rem" }}
    >
      {change.oldValue}
    </span>
    <span
      className="text-secondary fw-bold"
      style={{
        fontSize: "1.1rem",
        margin: "0 0.2rem",
      }}
    >
      →
    </span>
    <span
      className="text-success bg-success-subtle px-1 rounded fw-bold"
      style={{ fontSize: "0.75rem" }}
    >
      {change.newValue}
    </span>
  </div>
);

const AuditLine: FC<{ line: string }> = ({ line }) => {
  const change = auditChangeOf(line);
  if (change) {
    return <AuditChangeLine change={change} />;
  }
  if (line.startsWith("Admin Comment:")) {
    return (
      <div
        className="mt-2 pt-1 border-top text-dark-emphasis fw-semibold"
        style={{ fontSize: "0.85rem" }}
      >
        {line}
      </div>
    );
  }
  return (
    <div style={{ whiteSpace: "pre-wrap" }} className="my-1">
      {line}
    </div>
  );
};

// A change recorded by the system, as opposed to a comment
const AuditNote: FC<{ note: BugStatusLog }> = ({ note }) => {
  const cleanComment = (note.comment || "").replace("[Audit] ", "");
  return (
    <Alert
      variant="light"
      className="py-2 px-3 m-0 small border rounded-3 bg-light text-muted"
    >
      <div className="d-flex align-items-center mb-1 border-bottom pb-1">
        <span
          className="badge bg-secondary-subtle text-secondary small font-monospace"
          style={{
            fontSize: "0.65rem",
            padding: "0.2rem 0.4rem",
          }}
        >
          SYSTEM AUDIT
        </span>
        <span
          className="text-muted small ms-auto"
          style={{ fontSize: "0.7rem" }}
        >
          <DateTime value={note.changedAt} />
        </span>
      </div>
      <div
        className="font-monospace text-secondary mt-1"
        style={{ fontSize: "0.8rem", lineHeight: "1.5" }}
      >
        {keyedLines(cleanComment).map(({ key, line }) => (
          <AuditLine key={key} line={line} />
        ))}
      </div>
    </Alert>
  );
};

const CommentNote: FC<{ note: BugStatusLog }> = ({ note }) => (
  <div className="border rounded p-2 bg-light">
    <div className="text-dark small" style={{ whiteSpace: "pre-wrap" }}>
      {note.comment}
    </div>
    <div className="text-end text-muted mt-1" style={{ fontSize: "0.75rem" }}>
      {note.changedBy?.name || "Anonymous"} at{" "}
      <DateTime value={note.changedAt} />
    </div>
  </div>
);

interface BugNoteListProps {
  notes: BugStatusLog[];
  isLoading: boolean;
}

/** The comments and audit notes of a bug, oldest first. */
export const BugNoteList: FC<BugNoteListProps> = ({ notes, isLoading }) => {
  if (isLoading) {
    return (
      <div className="d-flex align-items-center py-2">
        <Spinner
          animation="border"
          size="sm"
          variant="secondary"
          className="me-2"
        />
        <span className="text-muted small">Loading notes...</span>
      </div>
    );
  }
  if (notes.length === 0) {
    return (
      <p className="text-muted small">No comments or logs recorded yet.</p>
    );
  }
  return (
    <div
      className="d-flex flex-column gap-2 mb-3"
      style={{ maxHeight: "300px", overflowY: "auto" }}
    >
      {notes.map((note) =>
        note.comment?.startsWith("[Audit]") ? (
          <AuditNote key={note.id} note={note} />
        ) : (
          <CommentNote key={note.id} note={note} />
        ),
      )}
    </div>
  );
};
