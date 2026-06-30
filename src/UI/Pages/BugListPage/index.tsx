import { BugFormModal } from "@/UI/Components/BugFormModal";
import { BugApprovalModal } from "@/UI/Components/BugApprovalModal";
import { BugList } from "@/UI/Components/BugList";
import { BugSearchForm } from "@/UI/Components/BugSearchForm";
import { withPageVisit } from "@variamosple/variamos-components";
import { FC, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Modal,
  Row,
  Spinner,
  Tab,
  Tabs,
  Form,
} from "react-bootstrap";
import { ArrowRepeat, Plus, Github } from "react-bootstrap-icons";
import { useBugList } from "./useBugList";

const BugListPageComponent: FC = () => {
  const {
    bugs,
    repos,
    categories,
    isLoading,
    isSubmitting,
    isSyncing,
    setFilter,
    handleCreateBug,
    handleSyncBugs,
    activeTab,
    setActiveTab,
    handleReject,
    handleRestore,
    handleApprove,
    error,
    notes,
    isLoadingNotes,
    fetchNotes,
    handleAddNote,
  } = useBugList();

  const [showUserCreateModal, setShowUserCreateModal] = useState(false);
  const [showAdminCreateModal, setShowAdminCreateModal] = useState(false);
  const [bugToApprove, setBugToApprove] = useState<any>(null);
  const [selectedBugForDetails, setSelectedBugForDetails] = useState<any>(null);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const handleViewDetails = (bug: any) => {
    setSelectedBugForDetails(bug);
    if (bug && bug.id) {
      fetchNotes(bug.id);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteBody.trim() || !selectedBugForDetails?.id) return;
    setIsSubmittingNote(true);
    const success = await handleAddNote(selectedBugForDetails.id, newNoteBody);
    if (success) {
      setNewNoteBody("");
    }
    setIsSubmittingNote(false);
  };

  return (
    <Container fluid="sm" className="my-2">
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="mb-0">Bugs list</h1>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          {activeTab === "github" && (
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
          <Button
            variant="success"
            onClick={() => setShowAdminCreateModal(true)}
            className="d-inline-flex align-items-center text-white"
            disabled={isSyncing}
          >
            <Github size={16} className="me-1" /> Create GitHub Issue
          </Button>
        </Col>
      </Row>
      <hr />

      {error && (
        <Alert variant="danger" dismissible>
          {error}
        </Alert>
      )}

      <BugSearchForm
        onSubmit={(search) => setFilter(search || {})}
        onSearchReset={() => setFilter({})}
        isLoading={isLoading}
        repos={repos}
        activeTab={activeTab}
      />

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k as any)}
        className="mb-3"
      >
        <Tab eventKey="github" title="GitHub Bugs">
          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center p-5">
              <Spinner animation="border" variant="primary" className="me-2" />
              <span>Loading bugs...</span>
            </div>
          ) : (
            <BugList
              items={bugs}
              onViewDetails={handleViewDetails}
              activeTab={activeTab}
              onReject={handleReject}
              onRestore={handleRestore}
              onApprove={setBugToApprove}
            />
          )}
        </Tab>
        <Tab eventKey="local" title="Local Inbox">
          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center p-5">
              <Spinner animation="border" variant="primary" className="me-2" />
              <span>Loading bugs...</span>
            </div>
          ) : (
            <BugList
              items={bugs}
              onViewDetails={handleViewDetails}
              activeTab={activeTab}
              onReject={handleReject}
              onRestore={handleRestore}
              onApprove={setBugToApprove}
            />
          )}
        </Tab>
        <Tab eventKey="trash" title="Trash Bin">
          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center p-5">
              <Spinner animation="border" variant="primary" className="me-2" />
              <span>Loading bugs...</span>
            </div>
          ) : (
            <BugList
              items={bugs}
              onViewDetails={handleViewDetails}
              activeTab={activeTab}
              onReject={handleReject}
              onRestore={handleRestore}
              onApprove={setBugToApprove}
            />
          )}
        </Tab>
      </Tabs>

      <BugFormModal
        mode="user"
        show={showUserCreateModal}
        onHide={() => setShowUserCreateModal(false)}
        onSubmit={async (data, file) => {
          await handleCreateBug(
            data.title,
            data.description,
            data.priority,
            data.category,
            data.githubRepo,
            file,
          );
          setShowUserCreateModal(false);
        }}
        repos={repos}
        categories={categories}
        isSubmitting={isSubmitting}
      />

      <BugFormModal
        mode="admin"
        show={showAdminCreateModal}
        onHide={() => setShowAdminCreateModal(false)}
        onSubmit={async (data, file) => {
          await handleCreateBug(
            data.title,
            data.description,
            data.priority,
            data.category,
            data.githubRepo,
            file,
          );
          setShowAdminCreateModal(false);
        }}
        repos={repos}
        categories={categories}
        isSubmitting={isSubmitting}
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
        show={!!selectedBugForDetails}
        onHide={() => setSelectedBugForDetails(null)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
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
                    <Badge
                      bg={
                        selectedBugForDetails.priority === "high"
                          ? "danger"
                          : selectedBugForDetails.priority === "medium"
                            ? "warning"
                            : "info"
                      }
                      text={
                        selectedBugForDetails.priority === "high"
                          ? "white"
                          : "dark"
                      }
                    >
                      {selectedBugForDetails.priority.toUpperCase()}
                    </Badge>
                  )}
                  {selectedBugForDetails.status && (
                    <Badge
                      bg={
                        selectedBugForDetails.status === "open"
                          ? "success"
                          : selectedBugForDetails.status === "closed"
                            ? "secondary"
                            : "light"
                      }
                      text={
                        selectedBugForDetails.status === "open" ||
                        selectedBugForDetails.status === "closed"
                          ? "white"
                          : "dark"
                      }
                    >
                      {selectedBugForDetails.status.toUpperCase()}
                    </Badge>
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
                </Col>
                <Col md={6}>
                  <strong>Created At: </strong>{" "}
                  {selectedBugForDetails.createdAt
                    ? new Date(selectedBugForDetails.createdAt).toLocaleString()
                    : "N/A"}
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
                    <ul className="mt-1 mb-0 pl-3">
                      {selectedBugForDetails.attachments.map(
                        (attachment: any) => (
                          <li key={attachment.id} className="my-1">
                            <a
                              href={`${process.env.REACT_APP_ADMIN_API_URL || "http://localhost:4000"}${attachment.filePath}`}
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
                    {notes.map((note) => {
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
                                className="badge bg-secondary-subtle text-secondary small-text font-monospace"
                                style={{
                                  fontSize: "0.65rem",
                                  padding: "0.2rem 0.4rem",
                                }}
                              >
                                SYSTEM AUDIT
                              </span>
                              <span
                                className="text-muted small-text ms-auto"
                                style={{ fontSize: "0.7rem" }}
                              >
                                {new Date(note.changedAt).toLocaleString()}
                              </span>
                            </div>
                            <div
                              className="font-monospace text-secondary mt-1"
                              style={{ fontSize: "0.8rem", lineHeight: "1.5" }}
                            >
                              {cleanComment.split("\n").map((line, idx) => {
                                if (line.startsWith("* ")) {
                                  const content = line.substring(2);
                                  if (content.includes(" -> ")) {
                                    const [left, right] = content.split(" -> ");
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
                            className="text-dark small-text"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {note.comment}
                          </div>
                          <div
                            className="text-end text-muted mt-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {note.changedBy?.name || "Anonymous"} at{" "}
                            {new Date(note.changedAt).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedBugForDetails.status === "pending" ? (
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
                    <div className="text-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingNote}
                      >
                        {isSubmittingNote ? "Adding..." : "Add Comment"}
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <Alert variant="warning" className="m-0 py-2 small">
                    This discussion is closed. Please use GitHub to communicate.
                  </Alert>
                )}
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

export default BugListPage;
