import { useSession, withPageVisit } from "@variamosple/variamos-components";
import { type FC, useId, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Container,
  Form,
  InputGroup,
  Spinner,
  Tab,
  Tabs,
} from "react-bootstrap";
import { Search } from "react-bootstrap-icons";
import {
  AnnouncementModal,
  NOTIFICATION_DISPATCH_PERMISSION,
} from "@/shared/components/AnnouncementModal";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useTimeZone } from "@/shared/hooks/useTimeZone";
import { ConfigurationFormModal } from "../components/ConfigurationFormModal";
import {
  ConfigurationGroups,
  type ConfigurationRowContext,
} from "../components/ConfigurationTable";
import { ScheduleChangeModal } from "../components/ScheduleChangeModal";
import { ScheduledChangesPanel } from "../components/ScheduledChangesPanel";
import type { ChangeAnnouncement } from "../domain/Entity/ChangeAnnouncement";
import type { Configuration } from "../domain/Entity/Configuration";
import { categoriesOf } from "../domain/Entity/ConfigurationCategory";
import { formatUtc } from "../domain/Entity/ScheduledChange";
import { useChangePlanning } from "../hooks/useChangePlanning";
import { useConfigurationList } from "../hooks/useConfigurationList";

const CONFIGURATION_UPDATE_PERMISSION = "configurations::update";

interface UnsavedChangesBannerProps {
  modifiedCount: number;
  isUpdating: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

// Floating action banner for unsaved changes
const UnsavedChangesBanner: FC<UnsavedChangesBannerProps> = (props) => {
  const { modifiedCount, isUpdating, onDiscard, onSave } = props;
  return (
    <Alert
      variant="warning"
      className="d-flex justify-content-between align-items-center py-2 px-3 mb-4 shadow-sm border-warning rounded"
    >
      <div className="d-flex align-items-center gap-2">
        <span className="fw-semibold">You have unsaved changes.</span>
        <Badge bg="warning" className="text-dark">
          {modifiedCount} settings modified
        </Badge>
      </div>
      <div className="d-flex gap-2">
        <Button
          variant="outline-secondary"
          size="sm"
          disabled={isUpdating}
          onClick={onDiscard}
        >
          Discard
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={isUpdating}
          onClick={onSave}
        >
          {isUpdating ? (
            <Spinner
              animation="border"
              size="sm"
              variant="light"
              className="me-1"
            />
          ) : null}
          Save Changes
        </Button>
      </div>
    </Alert>
  );
};

const SearchField: FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <div className="mb-4">
    <InputGroup style={{ maxWidth: "400px" }}>
      <InputGroup.Text className="bg-white border-end-0">
        <Search className="text-muted" />
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder="Search configuration keys..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-start-0 ps-0"
      />
    </InputGroup>
  </div>
);

interface CategoryTabsProps {
  configurations: Configuration[];
  isLoading: boolean;
  searchTerm: string;
  context: ConfigurationRowContext;
}

// One tab per category found in the configurations
const CategoryTabs: FC<CategoryTabsProps> = (props) => {
  const { configurations, isLoading, searchTerm, context } = props;
  const categoryTabsId = useId();
  const [activeTab, setActiveTab] = useState<string>("general");
  const categories = useMemo(
    () => categoriesOf(configurations),
    [configurations],
  );
  // Filter configurations by search term
  const filteredConfigs = useMemo(() => {
    return configurations.filter((c) => {
      const matchesSearch =
        c.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [configurations, searchTerm]);
  const shownTab = categories.some((category) => category.key === activeTab)
    ? activeTab
    : categories[0]?.key;

  if (categories.length === 0) {
    return isLoading ? (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2 text-muted">Loading settings...</div>
      </div>
    ) : (
      <div className="text-center py-4 text-muted bg-light rounded border">
        No configurations found.
      </div>
    );
  }
  return (
    <Tabs
      id={categoryTabsId}
      activeKey={shownTab}
      onSelect={(k) => k && setActiveTab(k)}
      className="mb-4"
    >
      {categories.map((cat) => (
        <Tab key={cat.key} eventKey={cat.key} title={cat.label}>
          <ConfigurationGroups
            configs={filteredConfigs.filter((c) => c.category === cat.key)}
            context={context}
          />
        </Tab>
      ))}
    </Tabs>
  );
};

interface PlanningModalsProps {
  planning: ReturnType<typeof useChangePlanning>;
  timeZone: string;
}

// Writing a planned change, and cancelling one
const PlanningModals: FC<PlanningModalsProps> = ({ planning, timeZone }) => {
  const { scheduling, toCancel, setToCancel, cancelError } = planning;
  return (
    <>
      {scheduling ? (
        <ScheduleChangeModal
          config={scheduling.config}
          change={scheduling.change}
          onClose={() => planning.setScheduling(undefined)}
          onSaved={planning.onScheduled}
          timeZone={timeZone}
        />
      ) : null}

      <ConfirmationModal
        show={toCancel !== undefined}
        title="Cancel the planned change"
        message={
          toCancel
            ? `Cancel the change of ${toCancel.key} planned for ${formatUtc(toCancel.dueAt)}? The setting keeps its current value.`
            : ""
        }
        confirmLabel="Cancel the change"
        confirmButtonVariant="danger"
        onConfirm={() => toCancel && planning.cancelPlanned(toCancel)}
        onCancel={() => setToCancel(undefined)}
      />

      {cancelError ? (
        <Alert
          variant="danger"
          dismissible
          onClose={() => planning.setCancelError(null)}
          className="py-2"
        >
          {cancelError}
        </Alert>
      ) : null}
    </>
  );
};

// Who may announce a change, and who may change or plan a setting
const useConfigurationRights = () => {
  const user = useSession()?.user;
  const permissions = user?.permissions ?? [];
  return {
    userId: user?.id,
    // Offered after saving a setting users notice, to whoever may send it
    canAnnounce: permissions.includes(NOTIFICATION_DISPATCH_PERMISSION),
    // Planning is a change of the setting: the server asks the same right
    canUpdate: permissions.includes(CONFIGURATION_UPDATE_PERMISSION),
  };
};

const ConfigurationListPageComponent: FC = () => {
  usePageTitle("Global configurations");
  const list = useConfigurationList();
  const { configurations, isLoading, isUpdating, modifiedKeys } = list;
  const [confirming, setConfirming] = useState<"discard">();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toEditConfig, setToEditConfig] = useState<Configuration>();
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const { userId, canAnnounce, canUpdate } = useConfigurationRights();
  const [announcement, setAnnouncement] = useState<ChangeAnnouncement | null>(
    null,
  );
  const offerAnnouncement = (suggested: ChangeAnnouncement | null) => {
    if (suggested && canAnnounce) setAnnouncement(suggested);
  };
  const save = async () => offerAnnouncement(await list.saveChanges());

  // Planned changes are shown beside UTC in the time zone of the profile
  // (EV-115 lot C)
  const planning = useChangePlanning({ configurations, offerAnnouncement });
  const { timeZone } = useTimeZone();

  const context: ConfigurationRowContext = {
    modifiedKeys,
    saveFailures: list.saveFailures,
    plannedByKey: planning.plannedByKey,
    canUpdate,
    isUpdating,
    setLocalValue: list.setLocalValue,
    onEdit: (config) => {
      setToEditConfig(config);
      setShowEdit(true);
    },
    onSchedule: (config, change) => planning.setScheduling({ config, change }),
  };

  return (
    <Container fluid="sm" className="my-2 position-relative">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="mb-0">Global Configurations</h1>
        </div>
        {isLoading || isUpdating ? (
          <Spinner animation="border" size="sm" variant="primary" />
        ) : null}
      </div>
      <hr />

      {list.isDirty ? (
        <UnsavedChangesBanner
          modifiedCount={modifiedKeys.length}
          isUpdating={isUpdating}
          onDiscard={() => setConfirming("discard")}
          onSave={() => void save()}
        />
      ) : null}

      <ConfirmationModal
        show={confirming === "discard"}
        title="Discard changes"
        message={`Discard ${modifiedKeys.length} unsaved change(s)? The settings go back to their saved values.`}
        confirmLabel="Discard changes"
        confirmButtonVariant="danger"
        onConfirm={() => {
          list.discardChanges();
          setConfirming(undefined);
        }}
        onCancel={() => setConfirming(undefined)}
      />

      <AnnouncementModal
        announcement={announcement}
        onClose={() => setAnnouncement(null)}
      />

      <PlanningModals planning={planning} timeZone={timeZone} />
      <ScheduledChangesPanel
        changes={planning.scheduled.changes}
        error={planning.scheduled.error}
        userId={userId}
        canUpdate={canUpdate}
        timeZone={timeZone}
        onEdit={planning.editPlanned}
        onCancel={planning.setToCancel}
      />

      <ConfigurationFormModal
        showModal={showEdit}
        onClose={() => setShowEdit(false)}
        config={toEditConfig}
        onConfigSubmit={list.setLocalValue}
      />

      <SearchField value={searchTerm} onChange={setSearchTerm} />

      <CategoryTabs
        configurations={configurations}
        isLoading={isLoading}
        searchTerm={searchTerm}
        context={context}
      />
    </Container>
  );
};

export const ConfigurationListPage = withPageVisit(
  ConfigurationListPageComponent,
  "AdminConfigurationList",
);
