import { type FC, useId } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import type { Bug, BugStatusLog, BugUserRef } from "../../domain/Bug";
import type { BugNoteDraft } from "../../hooks/useBugDetails";
import { BugAssigneesForm } from "../BugAssigneesForm";
import { BugStatusForm } from "../BugStatusForm";
import { BugNoteList } from "./BugNoteList";
import { BugSummary } from "./BugSummary";

const BugNoteForm: FC<{ draft: BugNoteDraft }> = ({ draft }) => (
  <Form onSubmit={draft.submit} className="mt-3">
    <Form.Group className="mb-2">
      <Form.Control
        as="textarea"
        rows={3}
        placeholder="Write a comment..."
        value={draft.body}
        onChange={(e) => draft.setBody(e.target.value)}
        required
        disabled={draft.isSubmitting}
      />
    </Form.Group>
    {draft.error ? (
      <Alert variant="danger" className="py-2 small">
        {draft.error}
      </Alert>
    ) : null}
    <div className="text-end">
      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={draft.isSubmitting}
      >
        {draft.isSubmitting ? "Adding..." : "Add comment"}
      </Button>
    </div>
  </Form>
);

export interface BugDetailsModalProps {
  bug: Bug | null;
  onHide: () => void;
  /** Whether the viewer may assign, change the status and comment. */
  canUpdate: boolean;
  assignableUsers: BugUserRef[];
  notes: BugStatusLog[];
  isLoadingNotes: boolean;
  draft: BugNoteDraft;
  onSaveAssignees: (
    bug: Bug,
    bugId: string,
    userIds: string[],
  ) => Promise<string | null>;
  onChangeStatus: (
    bug: Bug,
    bugId: string,
    change: { status: string; comment?: string },
  ) => Promise<string | null>;
}

type BugDetailsProps = Omit<BugDetailsModalProps, "bug" | "onHide"> & {
  bug: Bug;
};

// The forms that change the bug, for those who may update it
const BugEditForms: FC<BugDetailsProps> = (props) => {
  const { bug, assignableUsers, onSaveAssignees, onChangeStatus } = props;
  // Kept apart, so that the forms below see it set
  const bugId = bug.id;
  if (!bugId) return null;
  return (
    <>
      <BugAssigneesForm
        key={(bug.assignedAdmins ?? []).map((user) => user.id).join()}
        assignees={bug.assignedAdmins ?? []}
        candidates={assignableUsers}
        onSave={(userIds) => onSaveAssignees(bug, bugId, userIds)}
      />
      {bug.gitIssueNumber && bug.status ? (
        <BugStatusForm
          key={bug.status}
          status={bug.status}
          onChangeStatus={(status, comment) =>
            onChangeStatus(bug, bugId, { status, comment })
          }
        />
      ) : null}
    </>
  );
};

const BugDiscussion: FC<BugDetailsProps> = (props) => {
  const { bug, canUpdate, notes, isLoadingNotes, draft } = props;
  return (
    <div className="mb-3">
      <h5 className="mb-3">Comments & Audit Logs</h5>
      <BugNoteList notes={notes} isLoading={isLoadingNotes} />
      {bug.status === "pending" ? null : (
        <Alert variant="warning" className="m-0 py-2 small">
          This discussion is closed. Please use GitHub to communicate.
        </Alert>
      )}
      {bug.status === "pending" && canUpdate ? (
        <BugNoteForm draft={draft} />
      ) : null}
    </div>
  );
};

/** The details of a bug, its timeline, and what an administrator changes. */
export const BugDetailsModal: FC<BugDetailsModalProps> = (props) => {
  const { bug, onHide, canUpdate } = props;
  const titleId = useId();
  return (
    <Modal
      aria-labelledby={titleId}
      show={Boolean(bug)}
      onHide={onHide}
      size="lg"
      centered
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title id={titleId}>
          Bug Details {bug?.gitIssueNumber ? `#${bug.gitIssueNumber}` : ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {bug ? (
          <div>
            <BugSummary bug={bug} />
            {canUpdate ? <BugEditForms {...props} bug={bug} /> : null}
            <hr />
            <BugDiscussion {...props} bug={bug} />
          </div>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
