import { withPageVisit } from "@variamosple/variamos-components";
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
  LockFill,
  PencilFill,
  Search,
  ShieldFillExclamation,
  ShieldLockFill,
} from "react-bootstrap-icons";
import { ConfigurationFormModal } from "../components/ConfigurationFormModal";
import type { Configuration } from "../domain/Entity/Configuration";
import { useConfigurationList } from "../hooks/useConfigurationList";

const ConfigurationListPageComponent: FC = () => {
  const {
    configurations,
    isLoading,
    isUpdating,
    isDirty,
    modifiedKeys,
    setLocalValue,
    discardChanges,
    saveChanges,
  } = useConfigurationList();

  const [activeTab, setActiveTab] = useState<string>("general");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toEditConfig, setToEditConfig] = useState<Configuration>();
  const [showEdit, setShowEdit] = useState<boolean>(false);

  // Group configurations by categories and sub-groups
  const categories = [
    { key: "general", label: "General Options" },
    { key: "security", label: "Security & Passwords" },
    { key: "notification", label: "Notifications & SMTP" },
    { key: "env", label: "System & Environments" },
  ];

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
    return "Environment Settings";
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
                        </div>
                        {config.description && (
                          <div className="text-muted small mt-1">
                            {config.description}
                          </div>
                        )}
                        <div className="mt-2 d-flex gap-2">
                          <Badge
                            bg="light"
                            className="text-secondary border text-uppercase"
                          >
                            {config.type}
                          </Badge>
                          {config.requiresMfa && (
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip>
                                  Modifying this setting requires Multi-Factor
                                  Authentication
                                </Tooltip>
                              }
                            >
                              <Badge bg="warning" className="text-dark">
                                <ShieldLockFill className="me-1" />
                                MFA PROTECTED
                              </Badge>
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
                              disabled={config.isReadOnly || isUpdating}
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
                        {config.isReadOnly ? (
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip>This setting is read-only</Tooltip>
                            }
                          >
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              disabled
                            >
                              <ShieldFillExclamation className="text-muted" />
                            </Button>
                          </OverlayTrigger>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={isUpdating}
                            onClick={() => onConfigEdit(config)}
                            title="Edit setting"
                          >
                            <PencilFill />
                          </Button>
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
              onClick={discardChanges}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isUpdating}
              onClick={saveChanges}
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

      <Tabs
        id="config-category-tabs"
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k)}
        className="mb-4"
      >
        {categories.map((cat) => (
          <Tab key={cat.key} eventKey={cat.key} title={cat.label}>
            {isLoading && configurations.length === 0 ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="mt-2 text-muted">Loading settings...</div>
              </div>
            ) : (
              renderCategoryGroups(cat.key)
            )}
          </Tab>
        ))}
      </Tabs>
    </Container>
  );
};

export const ConfigurationListPage = withPageVisit(
  ConfigurationListPageComponent,
  "AdminConfigurationList",
);
export default ConfigurationListPage;
