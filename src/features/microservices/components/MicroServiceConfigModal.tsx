import { type FC, useEffect, useId, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Form,
  Modal,
  Spinner,
  Tab,
  Table,
  Tabs,
} from "react-bootstrap";
import { Check, PencilSquare, PlusLg } from "react-bootstrap-icons";
import { DateTime } from "@/shared/components/DateTime";
import {
  getMicroServiceAuditLogs,
  getMicroServiceConfigurations,
  updateMicroServiceConfiguration,
} from "../api/MicroServiceRepository";
import type {
  MicroServiceAuditEntry,
  MicroServiceConfigItem,
} from "../domain/Entity/MicroService";

// The API never sends a secret value: only this mask is shown
const SECRET_MASK = "********";

// A restart stands out, a scale change is marked, the rest is informative
const actionBadgeOf = (actionType: string) => {
  if (actionType === "RESTART") return "warning";
  return actionType === "SCALE_CHANGE" ? "primary" : "info";
};

export interface MicroServiceConfigModalProps {
  show: boolean;
  serviceName: string;
  displayName: string;
  onHide: () => void;
}

// The parameters and the audit trail of the service, read when shown
const useServiceSettings = (show: boolean, serviceName: string) => {
  const [configs, setConfigs] = useState<MicroServiceConfigItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<MicroServiceAuditEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // Shared by the edit and the addition of a parameter
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!show || !serviceName) return;

    setLoading(true);
    void Promise.all([
      getMicroServiceConfigurations(serviceName),
      getMicroServiceAuditLogs(serviceName),
    ])
      .then(([configRes, auditRes]) => {
        if (configRes.data) setConfigs(configRes.data);
        if (auditRes.data) setAuditLogs(auditRes.data);
      })
      .finally(() => setLoading(false));
  }, [show, serviceName]);

  // Read again after each change, which it records
  const refreshAudit = async () => {
    const auditRes = await getMicroServiceAuditLogs(serviceName);
    if (auditRes.data) setAuditLogs(auditRes.data);
  };

  return {
    serviceName,
    configs,
    setConfigs,
    auditLogs,
    loading,
    saveError,
    setSaveError,
    refreshAudit,
  };
};

type ServiceSettings = ReturnType<typeof useServiceSettings>;

// On a failure the edit stays open with what was typed, and says why (UX-07)
const useParameterEdit = (settings: ServiceSettings) => {
  const { serviceName, setConfigs, setSaveError, refreshAudit } = settings;
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const startEdit = (config: MicroServiceConfigItem) => {
    setEditingKey(config.key);
    setSaveError(null);
    // A secret is replaced, never edited: start from an empty field
    setEditValue(config.isSecret ? "" : config.value);
  };

  const save = async (key: string) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await updateMicroServiceConfiguration(
        serviceName,
        key,
        editValue,
      );
      if (res.data) {
        const updatedData = res.data;
        setConfigs((prev) =>
          prev.map((c) => (c.key === key ? updatedData : c)),
        );
        setEditingKey(null);
        await refreshAudit();
      } else {
        setSaveError(res.message ?? `The parameter ${key} could not be saved.`);
      }
    } catch (error) {
      console.error("Error saving microservice configuration:", error);
      setSaveError(`The parameter ${key} could not be saved.`);
    } finally {
      setIsSaving(false);
    }
  };

  return { editingKey, editValue, setEditValue, isSaving, startEdit, save };
};

type ParameterEdit = ReturnType<typeof useParameterEdit>;

// The form keeps what was typed while hidden, until a parameter is added
const useNewParameter = (settings: ServiceSettings) => {
  const { serviceName, setConfigs, setSaveError, refreshAudit } = settings;
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const add = async () => {
    if (!newKey.trim()) return;
    setIsAdding(true);
    setSaveError(null);
    try {
      const res = await updateMicroServiceConfiguration(
        serviceName,
        newKey.trim(),
        newValue.trim(),
      );
      if (res.data) {
        const created = res.data;
        setConfigs((prev) => [
          ...prev.filter((c) => c.key !== created.key),
          created,
        ]);
        setNewKey("");
        setNewValue("");
        setShowAddForm(false);
        await refreshAudit();
      } else {
        setSaveError(
          res.message ?? `The parameter ${newKey.trim()} could not be added.`,
        );
      }
    } catch (error) {
      console.error("Error creating microservice configuration:", error);
      setSaveError(`The parameter ${newKey.trim()} could not be added.`);
    } finally {
      setIsAdding(false);
    }
  };

  const fields = { newKey, setNewKey, newValue, setNewValue };
  return { showAddForm, setShowAddForm, fields, isAdding, add };
};

type NewParameter = ReturnType<typeof useNewParameter>;

const AddParameterForm: FC<{ adding: NewParameter }> = ({ adding }) => {
  const { newKey, setNewKey, newValue, setNewValue } = adding.fields;
  return (
    <div className="bg-light p-3 rounded mb-3 border">
      <h6 className="fw-bold mb-2">Add new configuration key</h6>
      <div className="row g-2">
        <div className="col-md-5">
          <Form.Control
            size="sm"
            placeholder="KEY_NAME (e.g. LOG_LEVEL)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
        </div>
        <div className="col-md-5">
          <Form.Control
            size="sm"
            placeholder="Value (e.g. debug, true, 8080)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        <div className="col-md-2 d-grid">
          <Button
            size="sm"
            variant="primary"
            onClick={adding.add}
            disabled={adding.isAdding || !newKey.trim()}
          >
            {adding.isAdding ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const ConfigValueCell: FC<{
  config: MicroServiceConfigItem;
  edit: ParameterEdit;
}> = ({ config, edit }) => {
  const { isSecret } = config;
  return (
    <td>
      {edit.editingKey === config.key ? (
        <Form.Control
          size="sm"
          type={isSecret ? "password" : "text"}
          value={edit.editValue}
          placeholder={isSecret ? "New value" : undefined}
          aria-label={`New value for ${config.key}`}
          autoComplete={isSecret ? "new-password" : "off"}
          onChange={(e) => edit.setEditValue(e.target.value)}
          disabled={edit.isSaving}
        />
      ) : (
        <span className="font-monospace text-break">
          {isSecret ? SECRET_MASK : config.value}
        </span>
      )}
    </td>
  );
};

const ConfigEditButton: FC<{
  config: MicroServiceConfigItem;
  edit: ParameterEdit;
}> = ({ config, edit }) =>
  edit.editingKey === config.key ? (
    <Button
      size="sm"
      variant="success"
      onClick={() => edit.save(config.key)}
      disabled={
        edit.isSaving || (config.isSecret && edit.editValue.trim() === "")
      }
      aria-label={`Save ${config.key}`}
      title="Save parameter"
    >
      <Check size={16} />
    </Button>
  ) : (
    <Button
      size="sm"
      variant="outline-primary"
      onClick={() => edit.startEdit(config)}
      aria-label={`Edit ${config.key}`}
      title="Edit parameter"
    >
      <PencilSquare size={14} />
    </Button>
  );

const ConfigRow: FC<{
  config: MicroServiceConfigItem;
  edit: ParameterEdit;
}> = ({ config, edit }) => (
  <tr>
    <td className="fw-semibold text-break">{config.key}</td>
    <ConfigValueCell config={config} edit={edit} />
    <td>
      <Badge bg="secondary">{config.type}</Badge>
    </td>
    <td>
      {config.isReadOnly ? (
        <Badge bg="dark">Read-only</Badge>
      ) : (
        <Badge bg="info" text="dark">
          Editable
        </Badge>
      )}
    </td>
    <td className="text-end">
      <div className="d-flex justify-content-end gap-1">
        {!config.isReadOnly && <ConfigEditButton config={config} edit={edit} />}
      </div>
    </td>
  </tr>
);

const LoadingSpinner: FC = () => (
  <div className="text-center my-4">
    <Spinner animation="border" variant="primary" />
  </div>
);

interface ConfigsTabProps {
  settings: ServiceSettings;
  edit: ParameterEdit;
  adding: NewParameter;
}

const ConfigsTab: FC<ConfigsTabProps> = ({ settings, edit, adding }) => {
  const { configs, loading, saveError } = settings;
  const { showAddForm, setShowAddForm } = adding;
  return (
    <>
      {saveError ? (
        <Alert
          variant="danger"
          dismissible
          onClose={() => settings.setSaveError(null)}
        >
          {saveError}
        </Alert>
      ) : null}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="small text-muted">
          Runtime parameters & environment overrides for this service.
        </span>
        <Button
          size="sm"
          variant={showAddForm ? "outline-secondary" : "outline-primary"}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <PlusLg size={14} className="me-1" />
          {showAddForm ? "Cancel" : "Add parameter"}
        </Button>
      </div>
      {showAddForm ? <AddParameterForm adding={adding} /> : null}
      {loading ? <LoadingSpinner /> : null}{" "}
      {!loading && configs.length === 0 && (
        <div className="text-muted text-center my-4">
          No custom configuration parameters found for this service. Click{" "}
          <strong>Add parameter</strong> above to configure environment
          overrides.
        </div>
      )}{" "}
      {!loading && configs.length > 0 && (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>Type</th>
              <th>Access</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((config) => (
              <ConfigRow key={config.key} config={config} edit={edit} />
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

const AuditTab: FC<{ settings: ServiceSettings }> = ({ settings }) => {
  const { auditLogs, loading } = settings;
  return (
    <>
      {loading ? <LoadingSpinner /> : null}{" "}
      {!loading && auditLogs.length === 0 && (
        <div className="text-muted text-center my-4">
          No modification history recorded yet.
        </div>
      )}{" "}
      {!loading && auditLogs.length > 0 && (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Action</th>
              <th>Operator</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log, idx) => (
              <tr key={log.id || idx}>
                <td className="small text-muted">
                  <DateTime value={log.createdAt} />
                </td>
                <td>
                  <Badge bg={actionBadgeOf(log.actionType)}>
                    {log.actionType}
                  </Badge>
                </td>
                <td>{log.performedBy}</td>
                <td className="small font-monospace text-break">
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

export const MicroServiceConfigModal: FC<MicroServiceConfigModalProps> = ({
  show,
  serviceName,
  displayName,
  onHide,
}) => {
  const [activeTab, setActiveTab] = useState<string>("configs");
  const settings = useServiceSettings(show, serviceName);
  const edit = useParameterEdit(settings);
  const adding = useNewParameter(settings);
  const titleId = useId();

  return (
    <Modal
      aria-labelledby={titleId}
      show={show}
      onHide={onHide}
      size="lg"
      centered
      animation={false}
    >
      <Modal.Header closeButton>
        <Modal.Title id={titleId}>
          ⚙️ Settings & Audit -{" "}
          <span className="text-primary">{displayName}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || "configs")}
          className="mb-3"
        >
          <Tab
            eventKey="configs"
            title={`Configurations (${settings.configs.length})`}
          >
            <ConfigsTab settings={settings} edit={edit} adding={adding} />
          </Tab>

          <Tab
            eventKey="audit"
            title={`Audit Trail (${settings.auditLogs.length})`}
          >
            <AuditTab settings={settings} />
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          data-testid="config-modal-close-btn"
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
