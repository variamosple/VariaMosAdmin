import { Paginator, withPageVisit } from "@variamosple/variamos-components";
import { type FC, useId, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Tab,
  Tabs,
} from "react-bootstrap";
import { ArrowRepeat, Github, Plus } from "react-bootstrap-icons";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { DateTime } from "@/shared/components/DateTime";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { attachmentUrl } from "../api/attachmentUrl";
import { BugApprovalModal } from "../components/BugApprovalModal";
import { BugAssigneesForm } from "../components/BugAssigneesForm";
import { BugFormModal } from "../components/BugFormModal";
import { BugList } from "../components/BugList";
import { BugPriorityBadge } from "../components/BugPriorityBadge";
import { BugSearchForm } from "../components/BugSearchForm";
import { BugStatusBadge } from "../components/BugStatusBadge";
import { BugStatusForm } from "../components/BugStatusForm";
import type { Bug, BugAttachment, BugStatusLog } from "../domain/Bug";
import { componentLabel } from "../domain/BugComponent";
import type { BugFilter } from "../domain/BugFilter";
import { useAssignableUsers } from "../hooks/useAssignableUsers";
import { useBugList } from "../hooks/useBugList";
import { useBugPermissions } from "../hooks/useBugPermissions";

const BugListPageComponent: FC = () => {
  usePageTitle("Bugs");
  const {
    bugs,
    repos,
    categories,
    isLoading,
    isSubmitting,
    isSyncing,
    filter,
    restoreKey,
    setFilter,
    handleCreateBug,
    refreshBugs,
    handleSyncBugs,
    activeTab,
    setActiveTab,
    currentPage,
    totalPages,
    onPageChange,
    handleReject,
    handleRestore,
    handleApprove,
    handleChangeStatus,
    handleSetAssignees,
    error,
    loadError,
    createError,
    clearCreateError,
    notes,
    isLoadingNotes,
    fetchNotes,
    handleAddNote,
  } = useBugList();
  const { canUpdate, canSync } = useBugPermissions();
  const assignableUsers = useAssignableUsers(canUpdate);

  const [showUserCreateModal, setShowUserCreateModal] = useState(false);
  const [showAdminCreateModal, setShowAdminCreateModal] = useState(false);
  const [bugToApprove, setBugToApprove] = useState<Bug | null>(null);
  const [bugToReject, setBugToReject] = useState<Bug | null>(null);
  const [selectedBugForDetails, setSelectedBugForDetails] =
    useState<Bug | null>(null);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const handleViewDetails = (bug: Bug) => {
    setSelectedBugForDetails(bug);
    setNoteError(null);
    if (bug?.id) {
      fetchNotes(bug.id);
    }
  };

  // The form stays open with its input when the creation fails (UX-08)
  const submitBug = async (data: Bug, file?: File) => {
    const created = await handleCreateBug(
      data.title,
      data.description,
      data.priority,
      data.category,
      data.githubRepo,
      file,
      data.component || undefined,
    );
    if (created) {
      setShowUserCreateModal(false);
      setShowAdminCreateModal(false);
    }
  };

  const hideCreateModals = () => {
    setShowUserCreateModal(false);
    setShowAdminCreateModal(false);
    clearCreateError();
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center p-5">
          <Spinner animation="border" variant="primary" className="me-2" />
          <span>Loading bugs...</span>
        </div>
      );
    }
    if (loadError) {
      return (
        <Alert variant="danger" className="d-flex align-items-center gap-2">
          <span>{loadError}</span>
          <Button
            variant="outline-danger"
            size="sm"
            className="ms-auto"
            onClick={() => refreshBugs()}
          >
            Retry
          </Button>
        </Alert>
      );
    }
    // One page is shown without a paginator
    const paginator = totalPages > 1 && (
      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    );
    return (
      <>
        {paginator}
        <BugList
          items={bugs}
          onViewDetails={handleViewDetails}
          activeTab={activeTab}
          onReject={
            canUpdate
              ? (id: string) =>
                  setBugToReject(bugs.find((bug) => bug.id === id) ?? null)
              : undefined
          }
          onRestore={canUpdate ? handleRestore : undefined}
          onApprove={canUpdate ? setBugToApprove : undefined}
        />
        {paginator}
      </>
    );
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteBody.trim() || !selectedBugForDetails?.id) return;
    setIsSubmittingNote(true);
    setNoteError(null);
    const failure = await handleAddNote(selectedBugForDetails.id, newNoteBody);
    if (failure) {
      setNoteError(failure);
    } else {
      setNewNoteBody("");
    }
    setIsSubmittingNote(false);
  };

  const titleId = useId();

  return (
    <Container fluid="sm" className="my-2">
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="mb-0">Bugs list</h1>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          {activeTab === "github" && canSync && (
            <Button
              variant="outline-secondary"
              onClick={handleSyncBugs}
              disabled={isSyncing || isLoading}
              className="d-inline-flex align-items-center"
              title="Sync with GitHub"
            >
              <ArrowRepeat size={18} className="me-1" />
              {isSyncing ? "Syncing..." : "Sync GitHub"}
            </Button>
          )}
          <Button
            variant="outline-primary"
            onClick={() => setShowUserCreateModal(true)}
            className="d-inline-flex align-items-center"
            disabled={isSyncing}
          >
            <Plus size={20} className="me-1" /> Report a Bug
          </Button>
          {canUpdate && (
            <Button
              variant="success"
              onClick={() => setShowAdminCreateModal(true)}
              className="d-inline-flex align-items-center text-white"
              disabled={isSyncing}
            >
              <Github size={16} className="me-1" /> Create GitHub issue
            </Button>
          )}
        </Col>
      </Row>
      <hr />

      {error && (
        <Alert variant="danger" dismissible>
          {error}
        </Alert>
      )}

      <BugSearchForm
        // A new form when the address changes by itself (UX-26)
        key={restoreKey}
        defaultFilter={filter}
        onSubmit={(search?: BugFilter) => setFilter(search || {})}
        onSearchReset={() => setFilter({})}
        isLoading={isLoading}
        repos={repos}
        activeTab={activeTab}
        assignees={assignableUsers}
      />

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => {
          if (k) setActiveTab(k as "github" | "local" | "trash");
        }}
        className="mb-3"
      >
        <Tab eventKey="github" title="GitHub Bugs">
          {renderTabContent()}
        </Tab>
        <Tab eventKey="local" title="Local Inbox">
          {renderTabContent()}
        </Tab>
        <Tab eventKey="trash" title="Trash Bin">
          {renderTabContent()}
        </Tab>
      </Tabs>

      <BugFormModal
        mode="user"
        show={showUserCreateModal}
        onHide={hideCreateModals}
        onSubmit={submitBug}
        repos={repos}
        categories={categories}
        isSubmitting={isSubmitting}
        error={createError}
      />

      <BugFormModal
        mode="admin"
        show={showAdminCreateModal}
        onHide={hideCreateModals}
        onSubmit={submitBug}
        repos={repos}
        categories={categories}
        isSubmitting={isSubmitting}
        error={createError}
      />

      <ConfirmationModal
        show={!!bugToReject}
        title="Reject bug"
        message={`Move "${bugToReject?.title ?? "this bug"}" to the Trash Bin? It can be restored for 7 days, then it is deleted.`}
        confirmLabel="Reject bug"
        confirmButtonVariant="danger"
        cancelLabel="Keep in inbox"
        onConfirm={() => {
          if (bugToReject?.id) handleReject(bugToReject.id);
          setBugToReject(null);
        }}
        onCancel={() => setBugToReject(null)}
      />

      <BugApprovalModal
        show={!!bugToApprove}
        bug={bugToApprove}
        onHide={() => setBugToApprove(null)}
        onConfirmApprove={handleApprove}
        repos={repos}
        categories={categories}
      />

      <Modal
        aria-labelledby={titleId}
        show={!!selectedBugForDetails}
        onHide={() => setSelectedBugForDetails(null)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title id={titleId}>
            Bug Details{" "}
            {selectedBugForDetails?.gitIssueNumber
              ? `#${selectedBugForDetails.gitIssueNumber}`
              : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBugForDetails && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">{selectedBugForDetails.title}</h4>
                <div className="d-flex gap-2">
                  <Badge bg="dark" className="text-light">
                    {selectedBugForDetails.githubRepo || "Local"}
                  </Badge>
                  {selectedBugForDetails.priority && (
                    <BugPriorityBadge
                      priority={selectedBugForDetails.priority}
                    />
                  )}
                  {selectedBugForDetails.status && (
                    <BugStatusBadge status={selectedBugForDetails.status} />
                  )}
                </div>
              </div>

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
                  {selectedBugForDetails.description}
                </div>
              </div>

              <Row className="mb-3">
                <Col md={6} className="mb-2 mb-md-0">
                  <strong>Category: </strong> {selectedBugForDetails.category}
                  <br />
                  <strong>Component: </strong>{" "}
                  {componentLabel(selectedBugForDetails.component)}
                </Col>
                <Col md={6}>
                  <strong>Created At: </strong>{" "}
                  <DateTime value={selectedBugForDetails.createdAt} />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6} className="mb-2 mb-md-0">
                  <strong>Creator: </strong>{" "}
                  {selectedBugForDetails.githubCreator
                    ? `@${selectedBugForDetails.githubCreator}`
                    : selectedBugForDetails.createdBy?.name || "System"}
                </Col>
                <Col md={6}>
                  <strong>Reporter Email: </strong>{" "}
                  {selectedBugForDetails.reporterEmail ||
                    selectedBugForDetails.createdBy?.email ||
                    "N/A"}
                </Col>
              </Row>

              <Row className="mb-3">
                <Col>
                  <strong>Assigned to: </strong>{" "}
                  {selectedBugForDetails.assignedAdmins?.length
                    ? selectedBugForDetails.assignedAdmins
                        .map((user) => user.name)
                        .join(", ")
                    : "Nobody"}
                </Col>
              </Row>

              {selectedBugForDetails.githubRepo &&
                selectedBugForDetails.gitIssueNumber && (
                  <div
                    className="mb-3 bg-light p-2 rounded"
                    style={{ border: "1px dashed #ced4da" }}
                  >
                    <strong>GitHub Link: </strong>
                    <a
                      href={`https://github.com/${selectedBugForDetails.githubRepo}/issues/${selectedBugForDetails.gitIssueNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none ms-1 font-monospace"
                    >
                      {selectedBugForDetails.githubRepo}#
                      {selectedBugForDetails.gitIssueNumber}
                    </a>
                  </div>
                )}

              {selectedBugForDetails.attachments &&
                selectedBugForDetails.attachments.length > 0 && (
                  <div className="mb-3">
                    <strong>Attachments:</strong>
                    <ul className="mt-1 mb-0 ps-3">
                      {selectedBugForDetails.attachments.map(
                        (attachment: BugAttachment) => (
                          <li key={attachment.id} className="my-1">
                            <a
                              href={attachmentUrl(attachment.filePath)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                            >
                              View Attachment (Type:{" "}
                              {attachment.fileType || "unknown"})
                            </a>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {canUpdate && selectedBugForDetails.id && (
                <BugAssigneesForm
                  key={(selectedBugForDetails.assignedAdmins ?? [])
                    .map((user) => user.id)
                    .join()}
                  assignees={selectedBugForDetails.assignedAdmins ?? []}
                  candidates={assignableUsers}
                  onSave={async (userIds) => {
                    const bugId = selectedBugForDetails.id as string;
                    const result = await handleSetAssignees(bugId, userIds);
                    if ("error" in result) return result.error;
                    setSelectedBugForDetails({
                      ...selectedBugForDetails,
                      assignedAdmins: result.assignees,
                    });
                    // The API notes the change in the timeline
                    fetchNotes(bugId);
                    return null;
                  }}
                />
              )}

              {canUpdate &&
                selectedBugForDetails.id &&
                selectedBugForDetails.gitIssueNumber &&
                selectedBugForDetails.status && (
                  <BugStatusForm
                    key={selectedBugForDetails.status}
                    status={selectedBugForDetails.status}
                    onChangeStatus={async (status, comment) => {
                      const bugId = selectedBugForDetails.id as string;
                      const failure = await handleChangeStatus(
                        bugId,
                        status,
                        comment,
                      );
                      if (!failure) {
                        setSelectedBugForDetails({
                          ...selectedBugForDetails,
                          status,
                        });
                        fetchNotes(bugId);
                      }
                      return failure;
                    }}
                  />
                )}

              <hr />
              <div className="mb-3">
                <h5 className="mb-3">Comments & Audit Logs</h5>
                {isLoadingNotes ? (
                  <div className="d-flex align-items-center py-2">
                    <Spinner
                      animation="border"
                      size="sm"
                      variant="secondary"
                      className="me-2"
                    />
                    <span className="text-muted small">Loading notes...</span>
                  </div>
                ) : notes.length === 0 ? (
                  <p className="text-muted small">
                    No comments or logs recorded yet.
                  </p>
                ) : (
                  <div
                    className="d-flex flex-column gap-2 mb-3"
                    style={{ maxHeight: "300px", overflowY: "auto" }}
                  >
                    {notes.map((note: BugStatusLog) => {
                      const isSystem = note.comment?.startsWith("[Audit]");
                      if (isSystem) {
                        const cleanComment = (note.comment || "").replace(
                          "[Audit] ",
                          "",
                        );
                        return (
                          <Alert
                            key={note.id}
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
                              {cleanComment
                                .split("\n")
                                .map((line: string, idx: number) => {
                                  if (line.startsWith("* ")) {
                                    const content = line.substring(2);
                                    if (content.includes(" -> ")) {
                                      const [left, right] =
                                        content.split(" -> ");
                                      const colonIndex = left.indexOf(":");
                                      if (colonIndex !== -1) {
                                        const label = left.substring(
                                          0,
                                          colonIndex + 1,
                                        );
                                        const oldValue = left
                                          .substring(colonIndex + 1)
                                          .trim();
                                        return (
                                          <div
                                            // biome-ignore lint/suspicious/noArrayIndexKey: split lines of static system log note
                                            key={idx}
                                            className="my-1 ps-2 border-start border-2 border-secondary-subtle d-flex flex-wrap align-items-center gap-1"
                                          >
                                            <strong className="text-dark-emphasis me-1">
                                              {label}
                                            </strong>
                                            <span
                                              className="text-danger bg-danger-subtle px-1 rounded"
                                              style={{ fontSize: "0.75rem" }}
                                            >
                                              {oldValue}
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
                                              {right}
                                            </span>
                                          </div>
                                        );
                                      }
                                    }
                                  }
                                  if (line.startsWith("Admin Comment:")) {
                                    return (
                                      <div
                                        // biome-ignore lint/suspicious/noArrayIndexKey: split lines of static system log note
                                        key={idx}
                                        className="mt-2 pt-1 border-top text-dark-emphasis fw-semibold"
                                        style={{ fontSize: "0.85rem" }}
                                      >
                                        {line}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div
                                      // biome-ignore lint/suspicious/noArrayIndexKey: split lines of static system log note
                                      key={idx}
                                      style={{ whiteSpace: "pre-wrap" }}
                                      className="my-1"
                                    >
                                      {line}
                                    </div>
                                  );
                                })}
                            </div>
                          </Alert>
                        );
                      }
                      return (
                        <div
                          key={note.id}
                          className="border rounded p-2 bg-light"
                        >
                          <div
                            className="text-dark small"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {note.comment}
                          </div>
                          <div
                            className="text-end text-muted mt-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {note.changedBy?.name || "Anonymous"} at{" "}
                            <DateTime value={note.changedAt} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedBugForDetails.status !== "pending" ? (
                  <Alert variant="warning" className="m-0 py-2 small">
                    This discussion is closed. Please use GitHub to communicate.
                  </Alert>
                ) : canUpdate ? (
                  <Form onSubmit={handleNoteSubmit} className="mt-3">
                    <Form.Group className="mb-2">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Write a comment..."
                        value={newNoteBody}
                        onChange={(e) => setNewNoteBody(e.target.value)}
                        required
                        disabled={isSubmittingNote}
                      />
                    </Form.Group>
                    {noteError && (
                      <Alert variant="danger" className="py-2 small">
                        {noteError}
                      </Alert>
                    )}
                    <div className="text-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingNote}
                      >
                        {isSubmittingNote ? "Adding..." : "Add comment"}
                      </Button>
                    </div>
                  </Form>
                ) : null}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setSelectedBugForDetails(null)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export const BugListPage = withPageVisit(BugListPageComponent, "AdminBugList");
