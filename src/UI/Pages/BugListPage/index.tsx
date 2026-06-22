import { BugFormModal } from "@/UI/Components/BugFormModal";
import { BugApprovalModal } from "@/UI/Components/BugApprovalModal";
import { BugList } from "@/UI/Components/BugList";
import { BugSearchForm } from "@/UI/Components/BugSearchForm";
import { withPageVisit } from "@variamosple/variamos-components";
import { FC, useState } from "react";
import { Alert, Badge, Button, Col, Container, Modal, Row, Spinner, Tab, Tabs } from "react-bootstrap";
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
  } = useBugList();

  const [showUserCreateModal, setShowUserCreateModal] = useState(false);
  const [showAdminCreateModal, setShowAdminCreateModal] = useState(false);
  const [bugToApprove, setBugToApprove] = useState<any>(null);
  const [selectedBugForDetails, setSelectedBugForDetails] = useState<any>(null);

  const handleViewDetails = (bug: any) => {
    setSelectedBugForDetails(bug);
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

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k as any)} className="mb-3">
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
            file
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
            file
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
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Bug Details {selectedBugForDetails?.gitIssueNumber ? `#${selectedBugForDetails.gitIssueNumber}` : ""}
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
                      text={selectedBugForDetails.priority === "high" ? "white" : "dark"}
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
                    : (selectedBugForDetails.createdBy?.name || "System")}
                </Col>
                <Col md={6}>
                  <strong>Reporter Email: </strong>{" "}
                  {selectedBugForDetails.reporterEmail ||
                    selectedBugForDetails.createdBy?.email ||
                    "N/A"}
                </Col>
              </Row>

              {selectedBugForDetails.githubRepo && selectedBugForDetails.gitIssueNumber && (
                <div className="mb-3 bg-light p-2 rounded" style={{ border: "1px dashed #ced4da" }}>
                  <strong>GitHub Link: </strong>
                  <a
                    href={`https://github.com/${selectedBugForDetails.githubRepo}/issues/${selectedBugForDetails.gitIssueNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none ms-1 font-monospace"
                  >
                    {selectedBugForDetails.githubRepo}#{selectedBugForDetails.gitIssueNumber}
                  </a>
                </div>
              )}

              {selectedBugForDetails.attachments && selectedBugForDetails.attachments.length > 0 && (
                <div className="mb-3">
                  <strong>Attachments:</strong>
                  <ul className="mt-1 mb-0 pl-3">
                    {selectedBugForDetails.attachments.map((attachment: any) => (
                      <li key={attachment.id} className="my-1">
                        <a
                          href={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}${attachment.filePath}`}
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
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedBugForDetails(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export const BugListPage = withPageVisit(
  BugListPageComponent,
  "AdminBugList"
);

export default BugListPage;
