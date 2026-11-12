import { Paginator, withPageVisit } from "@variamosple/variamos-components";
import { type ComponentProps, type FC, type ReactNode, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  Row,
  Spinner,
  Tab,
  Tabs,
} from "react-bootstrap";
import { ArrowRepeat, Github, Plus } from "react-bootstrap-icons";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { isOneOf } from "@/shared/domain/Value/isOneOf";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { BugApprovalModal } from "../components/BugApprovalModal";
import { BugDetailsModal } from "../components/BugDetailsModal";
import { BugFormModal } from "../components/BugFormModal";
import { BugList } from "../components/BugList";
import { BugSearchForm } from "../components/BugSearchForm";
import type { Bug } from "../domain/Bug";
import type { BugFilter } from "../domain/BugFilter";
import { useAssignableUsers } from "../hooks/useAssignableUsers";
import { useBugDetails } from "../hooks/useBugDetails";
import { BUG_TABS, type BugTab, useBugList } from "../hooks/useBugList";
import { useBugPermissions } from "../hooks/useBugPermissions";

interface BugListHeaderProps {
  showSync: boolean;
  isSyncing: boolean;
  isLoading: boolean;
  canUpdate: boolean;
  onSync: () => void;
  onCreate: (mode: CreateMode) => void;
  error: string | null;
}

const BugListHeader: FC<BugListHeaderProps> = (props) => {
  const { showSync, isSyncing, isLoading, canUpdate, onSync, onCreate } = props;
  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="mb-0">Bugs list</h1>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          {showSync ? (
            <Button
              variant="outline-secondary"
              onClick={onSync}
              disabled={isSyncing || isLoading}
              className="d-inline-flex align-items-center"
              title="Sync with GitHub"
            >
              <ArrowRepeat size={18} className="me-1" />
              {isSyncing ? "Syncing..." : "Sync GitHub"}
            </Button>
          ) : null}
          <Button
            variant="outline-primary"
            onClick={() => onCreate("user")}
            className="d-inline-flex align-items-center"
            disabled={isSyncing}
          >
            <Plus size={20} className="me-1" /> Report a Bug
          </Button>
          {canUpdate ? (
            <Button
              variant="success"
              onClick={() => onCreate("admin")}
              className="d-inline-flex align-items-center text-white"
              disabled={isSyncing}
            >
              <Github size={16} className="me-1" /> Create GitHub issue
            </Button>
          ) : null}
        </Col>
      </Row>
      <hr />

      {props.error ? (
        <Alert variant="danger" dismissible>
          {props.error}
        </Alert>
      ) : null}
    </>
  );
};

interface BugTabContentProps {
  bugList: ReturnType<typeof useBugList>;
  list: ComponentProps<typeof BugList>;
}

const BugTabContent: FC<BugTabContentProps> = ({ bugList, list }) => {
  const { isLoading, loadError, currentPage, totalPages } = bugList;
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
          onClick={() => bugList.refreshBugs()}
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
      onPageChange={bugList.onPageChange}
    />
  );
  return (
    <>
      {paginator}
      <BugList {...list} />
      {paginator}
    </>
  );
};

type CreateMode = "user" | "admin";

// The bug as the creation form sends it, with its attached file
const newBugOf = (data: Bug, file?: File) => ({
  title: data.title,
  description: data.description,
  priority: data.priority,
  category: data.category,
  githubRepo: data.githubRepo,
  file,
  component: data.component || undefined,
});

type BugCreateModalsProps = Omit<
  ComponentProps<typeof BugFormModal>,
  "mode" | "show"
> & { createMode: CreateMode | null };

// One form per mode, each keeping its own input while hidden
const BugCreateModals: FC<BugCreateModalsProps> = ({ createMode, ...form }) =>
  (["user", "admin"] as const).map((mode) => (
    <BugFormModal key={mode} mode={mode} show={createMode === mode} {...form} />
  ));

const BugTabs: FC<{
  activeTab: BugTab;
  onSelect: (tab: BugTab) => void;
  content: ReactNode;
}> = ({ activeTab, onSelect, content }) => (
  <Tabs
    activeKey={activeTab}
    onSelect={(k) => {
      if (k && isOneOf(BUG_TABS, k)) onSelect(k);
    }}
    className="mb-3"
  >
    <Tab eventKey="github" title="GitHub Bugs">
      {content}
    </Tab>
    <Tab eventKey="local" title="Local Inbox">
      {content}
    </Tab>
    <Tab eventKey="trash" title="Trash Bin">
      {content}
    </Tab>
  </Tabs>
);

const RejectBugModal: FC<{
  bug: Bug | null;
  onReject: (id: string) => void;
  onClose: () => void;
}> = ({ bug, onReject, onClose }) => (
  <ConfirmationModal
    show={Boolean(bug)}
    title="Reject bug"
    message={`Move "${bug?.title ?? "this bug"}" to the Trash Bin? It can be restored for 7 days, then it is deleted.`}
    confirmLabel="Reject bug"
    confirmButtonVariant="danger"
    cancelLabel="Keep in inbox"
    onConfirm={() => {
      if (bug?.id) onReject(bug.id);
      onClose();
    }}
    onCancel={onClose}
  />
);

// The creation form shown, if any, and what it does
const useBugCreation = (bugList: ReturnType<typeof useBugList>) => {
  const [mode, setMode] = useState<CreateMode | null>(null);

  // The form stays open with its input when the creation fails (UX-08)
  const submit = async (data: Bug, file?: File) => {
    const created = await bugList.handleCreateBug(newBugOf(data, file));
    if (created) {
      setMode(null);
    }
  };

  const hide = () => {
    setMode(null);
    bugList.clearCreateError();
  };

  return { mode, setMode, submit, hide };
};

const BugListPageComponent: FC = () => {
  usePageTitle("Bugs");
  const bugList = useBugList();
  const { bugs, repos, categories, isLoading, isSyncing, activeTab } = bugList;
  const { canUpdate, canSync } = useBugPermissions();
  const assignableUsers = useAssignableUsers(canUpdate);
  const details = useBugDetails(bugList);

  const creation = useBugCreation(bugList);
  const [bugToApprove, setBugToApprove] = useState<Bug | null>(null);
  const [bugToReject, setBugToReject] = useState<Bug | null>(null);

  const tabContent = (
    <BugTabContent
      bugList={bugList}
      list={{
        items: bugs,
        onViewDetails: details.open,
        activeTab,
        onReject: canUpdate
          ? (id: string) =>
              setBugToReject(bugs.find((bug) => bug.id === id) ?? null)
          : undefined,
        onRestore: canUpdate ? bugList.handleRestore : undefined,
        onApprove: canUpdate ? setBugToApprove : undefined,
      }}
    />
  );

  return (
    <Container fluid="sm" className="my-2">
      <BugListHeader
        showSync={activeTab === "github" && canSync}
        isSyncing={isSyncing}
        isLoading={isLoading}
        canUpdate={canUpdate}
        onSync={bugList.handleSyncBugs}
        onCreate={creation.setMode}
        error={bugList.error}
      />

      <BugSearchForm
        // A new form when the address changes by itself (UX-26)
        key={bugList.restoreKey}
        defaultFilter={bugList.filter}
        onSubmit={(search?: BugFilter) => bugList.setFilter(search ?? {})}
        onSearchReset={() => bugList.setFilter({})}
        isLoading={isLoading}
        repos={repos}
        activeTab={activeTab}
        assignees={assignableUsers}
      />

      <BugTabs
        activeTab={activeTab}
        onSelect={bugList.setActiveTab}
        content={tabContent}
      />

      <BugCreateModals
        createMode={creation.mode}
        onHide={creation.hide}
        onSubmit={creation.submit}
        repos={repos}
        categories={categories}
        isSubmitting={bugList.isSubmitting}
        error={bugList.createError}
      />

      <RejectBugModal
        bug={bugToReject}
        onReject={(id) => void bugList.handleReject(id)}
        onClose={() => setBugToReject(null)}
      />

      <BugApprovalModal
        show={Boolean(bugToApprove)}
        bug={bugToApprove}
        onHide={() => setBugToApprove(null)}
        onConfirmApprove={bugList.handleApprove}
        repos={repos}
        categories={categories}
      />

      <BugDetailsModal
        bug={details.bug}
        onHide={details.close}
        canUpdate={canUpdate}
        assignableUsers={assignableUsers}
        notes={bugList.notes}
        isLoadingNotes={bugList.isLoadingNotes}
        draft={details.draft}
        onSaveAssignees={details.saveAssignees}
        onChangeStatus={details.changeStatus}
      />
    </Container>
  );
};

export const BugListPage = withPageVisit(BugListPageComponent, "AdminBugList");
