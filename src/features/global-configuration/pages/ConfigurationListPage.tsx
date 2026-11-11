import { useSession, withPageVisit } from "@variamosple/variamos-components";
import { type FC, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Container,
  Form,
  InputGroup,
  OverlayTrigger,
  Spinner,
  Tab,
  Table,
  Tabs,
  Tooltip,
} from "react-bootstrap";
import {
  CalendarEvent,
  LockFill,
  PencilFill,
  Search,
  ShieldFillExclamation,
  ShieldLockFill,
} from "react-bootstrap-icons";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { IconButton } from "@/shared/components/IconButton";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useTimeZone } from "@/shared/hooks/useTimeZone";
import { cancelScheduledChange } from "../api/ScheduledChangeRepository";
import { AnnounceChangesModal } from "../components/AnnounceChangesModal";
import { ConfigurationFormModal } from "../components/ConfigurationFormModal";
import { ScheduleChangeModal } from "../components/ScheduleChangeModal";
import { ScheduledChangesPanel } from "../components/ScheduledChangesPanel";
import type { ChangeAnnouncement } from "../domain/Entity/ChangeAnnouncement";
import type { Configuration } from "../domain/Entity/Configuration";
import {
  categoriesOf,
  categoryLabel,
} from "../domain/Entity/ConfigurationCategory";
import {
  announcementOfScheduledChange,
  formatUtc,
  type ScheduledChange,
} from "../domain/Entity/ScheduledChange";
import { useConfigurationList } from "../hooks/useConfigurationList";
import { useScheduledChanges } from "../hooks/useScheduledChanges";

const NOTIFICATION_DISPATCH_PERMISSION = "admin::notifications::dispatch";
const CONFIGURATION_UPDATE_PERMISSION = "configurations::update";

const lockedLabel = (config: Configuration) =>
  config.isReadOnly
    ? "This setting is read-only"
    : "This setting is locked until a second-factor check is available";

const ConfigurationListPageComponent: FC = () => {
  usePageTitle("Global configurations");
  const {
    configurations,
    isLoading,
    isUpdating,
    isDirty,
    modifiedKeys,
    saveFailures,
    setLocalValue,
    discardChanges,
    saveChanges,
  } = useConfigurationList();
  const [confirming, setConfirming] = useState<"discard">();

  const [activeTab, setActiveTab] = useState<string>("general");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toEditConfig, setToEditConfig] = useState<Configuration>();
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const user = useSession()?.user;
  const permissions = user?.permissions ?? [];
  // Offered after saving a setting users notice, to whoever may send it
  const canAnnounce = permissions.includes(NOTIFICATION_DISPATCH_PERMISSION);
  // Planning is a change of the setting: the server asks the same right
  const canUpdate = permissions.includes(CONFIGURATION_UPDATE_PERMISSION);
  const [announcement, setAnnouncement] = useState<ChangeAnnouncement | null>(
    null,
  );
  const save = async () => {
    const suggested = await saveChanges();
    if (suggested && canAnnounce) setAnnouncement(suggested);
  };

  // Changes planned for a later date (EV-115 lot B), shown beside UTC in
  // the time zone of the profile (lot C)
  const scheduled = useScheduledChanges();
  const { timeZone } = useTimeZone();
  const plannedByKey = useMemo(
    () =>
      new Map(
        scheduled.changes
          .filter((change) => change.status === "scheduled")
          .map((change) => [change.key, change]),
      ),
    [scheduled.changes],
  );
  const [scheduling, setScheduling] = useState<{
    config: Configuration;
    change?: ScheduledChange;
  }>();
  const [toCancel, setToCancel] = useState<ScheduledChange>();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const offerAnnouncement = (change: ScheduledChange) => {
    const suggested = announcementOfScheduledChange(change);
    if (suggested && canAnnounce) setAnnouncement(suggested);
  };
  const editPlanned = (change: ScheduledChange) => {
    const config = configurations.find((c) => c.key === change.key);
    if (config) setScheduling({ config, change });
  };
  const onScheduled = (change: ScheduledChange) => {
    setScheduling(undefined);
    scheduled.reload();
    offerAnnouncement(change);
  };
  const cancelPlanned = async (change: ScheduledChange) => {
    setToCancel(undefined);
    setCancelError(null);
    const response = await cancelScheduledChange(change.id);
    scheduled.reload();
    if (response.errorCode || !response.data) {
      setCancelError(
        response.message || "The planned change could not be cancelled.",
      );
      return;
    }
    // A correction, for users who were told of the change
    offerAnnouncement(response.data);
  };

  // One tab per category found in the configurations
  const categories = useMemo(
    () => categoriesOf(configurations),
    [configurations],
  );
  const shownTab = categories.some((category) => category.key === activeTab)
    ? activeTab
    : categories[0]?.key;

  // Helper to determine Card Group Name from config key
  const getGroupName = (config: Configuration): string => {
    const key = config.key;
    if (key.startsWith("security.password")) return "Password Security Policy";
    if (key.startsWith("security.mfa"))
      return "Multi-Factor Authentication (MFA)";
    if (key.startsWith("notification.smtp"))
      return "SMTP Email Server Settings";
    if (key.startsWith("general.auth"))
      return "Authentication Provider Settings";

    // Default fallback based on category
    if (config.category === "general") return "General Application Settings";
    if (config.category === "security") return "General Security Settings";
    if (config.category === "notification")
      return "General Notification Settings";
    if (config.category === "env") return "Environment Settings";
    return `${categoryLabel(config.category)} Settings`;
  };

  // Filter configurations by search term and category
  const filteredConfigs = useMemo(() => {
    return configurations.filter((c) => {
      const matchesSearch =
        c.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [configurations, searchTerm]);

  const onConfigEdit = (config: Configuration) => {
    setToEditConfig(config);
    setShowEdit(true);
  };

  const renderCategoryGroups = (category: string) => {
    const categoryConfigs = filteredConfigs.filter(
      (c) => c.category === category,
    );

    if (categoryConfigs.length === 0) {
      return (
        <div className="text-center py-4 text-muted bg-light rounded border">
          No configurations found matching the criteria.
        </div>
      );
    }

    // Group items by sub-group
    const groups: { [groupName: string]: Configuration[] } = {};
    for (const config of categoryConfigs) {
      const gName = getGroupName(config);
      if (!groups[gName]) {
        groups[gName] = [];
      }
      groups[gName].push(config);
    }

    return (
      <div className="mt-2">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} className="mb-5">
            <h3 className="fs-5 fw-bold text-dark mb-3">{groupName}</h3>
            <Table striped bordered hover responsive className="align-middle">
              <thead>
                <tr>
                  <th style={{ width: "35%" }}>Setting Key</th>
                  <th style={{ width: "35%" }}>Value</th>
                  <th style={{ width: "10%" }}>Scope</th>
                  <th style={{ width: "12%" }}>Target Services</th>
                  <th className="text-center" style={{ width: "8%" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((config) => {
                  const isSecret = config.isSecret;
                  const isBoolean = config.type === "boolean";
                  const isModified = modifiedKeys.includes(config.key);
                  const saveFailure = saveFailures[config.key];
                  // The server refuses a change to a key that requires MFA
                  // until it can check a second factor (T-10)
                  const isLocked = config.isReadOnly || config.requiresMfa;
                  const planned = plannedByKey.get(config.key);
                  // A setting users notice may change at a later date
                  const canSchedule =
                    canUpdate && !isLocked && config.announcement !== undefined;

                  return (
                    <tr key={config.key}>
                      <td>
                        <div className="d-flex align-items-center flex-wrap gap-2">
                          <span className="fw-bold">{config.key}</span>
                          {isModified && (
                            <Badge bg="warning" className="text-dark small">
                              UNSAVED
                            </Badge>
                          )}
                          {planned && (
                            <Badge bg="info" className="text-dark small">
                              CHANGE PLANNED
                            </Badge>
                          )}
                        </div>
                        {saveFailure && isModified && (
                          <div className="text-danger small mt-1" role="alert">
                            Not saved: {saveFailure}
                          </div>
                        )}
                        {config.description && (
                          <div className="text-muted small mt-1">
                            {config.description}
                          </div>
                        )}
                        <div className="mt-2 d-flex gap-2">
                          <Badge
                            bg="light"
                            className="text-dark border text-uppercase"
                          >
                            {config.type}
                          </Badge>
                          {config.requiresMfa && (
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip>
                                  Changing this setting needs a second-factor
                                  check, which is not available yet.
                                </Tooltip>
                              }
                            >
                              <Badge bg="warning" className="text-dark">
                                <ShieldLockFill className="me-1" />
                                LOCKED
                              </Badge>
                            </OverlayTrigger>
                          )}
                          {config.isApplied === false && (
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip>
                                  Saved, but no service reads this setting yet:
                                  changing it has no effect.
                                </Tooltip>
                              }
                            >
                              <Badge bg="secondary">NOT APPLIED YET</Badge>
                            </OverlayTrigger>
                          )}
                        </div>
                      </td>
                      <td>
                        {isSecret ? (
                          <span className="text-muted">
                            <LockFill className="text-warning me-1" />
                            <code>********</code>
                          </span>
                        ) : isBoolean ? (
                          <div className="d-flex align-items-center gap-2">
                            <Form.Check
                              type="switch"
                              id={`toggle-${config.key}`}
                              checked={Boolean(config.value)}
                              disabled={isLocked || isUpdating}
                              onChange={(e) =>
                                setLocalValue(config.key, e.target.checked)
                              }
                              aria-label={`Toggle setting ${config.key}`}
                            />
                            <Badge bg={config.value ? "success" : "secondary"}>
                              {config.value ? "ENABLED" : "DISABLED"}
                            </Badge>
                          </div>
                        ) : config.type === "object" ||
                          config.type === "array" ? (
                          <pre
                            className="m-0 bg-light p-2 rounded border small text-secondary"
                            style={{ fontSize: "0.8rem", maxHeight: "150px" }}
                          >
                            {JSON.stringify(config.value, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-dark fw-medium">
                            {String(config.value)}
                            {config.accepts?.unit && (
                              <span className="text-muted fw-normal">
                                {" "}
                                {config.accepts.unit}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge
                          bg={
                            config.environmentScope === "all"
                              ? "primary"
                              : "secondary"
                          }
                        >
                          {config.environmentScope}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {config.targetServices.map((service) => (
                            <Badge key={service} bg="dark" className="small">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="text-center">
                        {isLocked ? (
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>{lockedLabel(config)}</Tooltip>}
                          >
                            <IconButton
                              size="sm"
                              variant="outline-secondary"
                              disabled
                              label={lockedLabel(config)}
                              icon={
                                <ShieldFillExclamation className="text-muted" />
                              }
                            />
                          </OverlayTrigger>
                        ) : (
                          <div className="d-flex justify-content-center gap-1">
                            <IconButton
                              size="sm"
                              variant="primary"
                              disabled={isUpdating}
                              onClick={() => onConfigEdit(config)}
                              label="Edit setting"
                              icon={<PencilFill />}
                            />
                            {canSchedule && (
                              <IconButton
                                size="sm"
                                variant="outline-primary"
                                disabled={isUpdating}
                                onClick={() =>
                                  setScheduling({ config, change: planned })
                                }
                                label={
                                  planned
                                    ? `Edit the change planned for ${formatUtc(planned.dueAt)}`
                                    : "Schedule a change"
                                }
                                icon={<CalendarEvent />}
                              />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Container fluid="sm" className="my-2 position-relative">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="mb-0">Global Configurations</h1>
        </div>
        {(isLoading || isUpdating) && (
          <Spinner animation="border" size="sm" variant="primary" />
        )}
      </div>
      <hr />

      {/* Floating Action Banner for Unsaved Changes */}
      {isDirty && (
        <Alert
          variant="warning"
          className="d-flex justify-content-between align-items-center py-2 px-3 mb-4 shadow-sm border-warning rounded"
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold">You have unsaved changes.</span>
            <Badge bg="warning" className="text-dark">
              {modifiedKeys.length} settings modified
            </Badge>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={isUpdating}
              onClick={() => setConfirming("discard")}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isUpdating}
              onClick={() => void save()}
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
      )}

      <ConfirmationModal
        show={confirming === "discard"}
        title="Discard changes"
        message={`Discard ${modifiedKeys.length} unsaved change(s)? The settings go back to their saved values.`}
        confirmLabel="Discard changes"
        confirmButtonVariant="danger"
        onConfirm={() => {
          discardChanges();
          setConfirming(undefined);
        }}
        onCancel={() => setConfirming(undefined)}
      />

      <AnnounceChangesModal
        announcement={announcement}
        onClose={() => setAnnouncement(null)}
      />

      {scheduling && (
        <ScheduleChangeModal
          config={scheduling.config}
          change={scheduling.change}
          onClose={() => setScheduling(undefined)}
          onSaved={onScheduled}
          timeZone={timeZone}
        />
      )}

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
        onConfirm={() => toCancel && cancelPlanned(toCancel)}
        onCancel={() => setToCancel(undefined)}
      />

      {cancelError && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setCancelError(null)}
          className="py-2"
        >
          {cancelError}
        </Alert>
      )}
      <ScheduledChangesPanel
        changes={scheduled.changes}
        error={scheduled.error}
        userId={user?.id}
        canUpdate={canUpdate}
        timeZone={timeZone}
        onEdit={editPlanned}
        onCancel={setToCancel}
      />

      <ConfigurationFormModal
        showModal={showEdit}
        onClose={() => setShowEdit(false)}
        config={toEditConfig}
        onConfigSubmit={setLocalValue}
      />

      <div className="mb-4">
        <InputGroup style={{ maxWidth: "400px" }}>
          <InputGroup.Text className="bg-white border-end-0">
            <Search className="text-muted" />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search configuration keys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-start-0 ps-0"
          />
        </InputGroup>
      </div>

      {categories.length === 0 ? (
        isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2 text-muted">Loading settings...</div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted bg-light rounded border">
            No configurations found.
          </div>
        )
      ) : (
        <Tabs
          id="config-category-tabs"
          activeKey={shownTab}
          onSelect={(k) => k && setActiveTab(k)}
          className="mb-4"
        >
          {categories.map((cat) => (
            <Tab key={cat.key} eventKey={cat.key} title={cat.label}>
              {renderCategoryGroups(cat.key)}
            </Tab>
          ))}
        </Tabs>
      )}
    </Container>
  );
};

export const ConfigurationListPage = withPageVisit(
  ConfigurationListPageComponent,
  "AdminConfigurationList",
);
