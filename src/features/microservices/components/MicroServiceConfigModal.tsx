import { type FC, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Form,
  InputGroup,
  Modal,
  Spinner,
  Tab,
  Table,
  Tabs,
} from "react-bootstrap";
import {
  Check,
  Eye,
  EyeSlash,
  PencilSquare,
  PlusLg,
} from "react-bootstrap-icons";
import {
  getMicroServiceAuditLogs,
  getMicroServiceConfigurations,
  updateMicroServiceConfiguration,
} from "../api/MicroServiceRepository";
import type {
  MicroServiceAuditEntry,
  MicroServiceConfigItem,
} from "../domain/Entity/MicroService";

export interface MicroServiceConfigModalProps {
  show: boolean;
  serviceName: string;
  displayName: string;
  onHide: () => void;
}

export const MicroServiceConfigModal: FC<MicroServiceConfigModalProps> = ({
  show,
  serviceName,
  displayName,
  onHide,
}) => {
  const [activeTab, setActiveTab] = useState<string>("configs");
  const [configs, setConfigs] = useState<MicroServiceConfigItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<MicroServiceAuditEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [revealedSecrets, setRevealedSecrets] = useState<
    Record<string, boolean>
  >({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // New parameter form
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);

  useEffect(() => {
    if (!show || !serviceName) return;

    setLoading(true);
    Promise.all([
      getMicroServiceConfigurations(serviceName),
      getMicroServiceAuditLogs(serviceName),
    ])
      .then(([configRes, auditRes]) => {
        if (configRes.data) setConfigs(configRes.data);
        if (auditRes.data) setAuditLogs(auditRes.data);
      })
      .finally(() => setLoading(false));
  }, [show, serviceName]);

  const toggleSecret = (key: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartEdit = (config: MicroServiceConfigItem) => {
    setEditingKey(config.key);
    setEditValue(config.value);
  };

  const handleSaveConfig = async (key: string) => {
    setIsSaving(true);
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
        // Refresh audit logs
        const auditRes = await getMicroServiceAuditLogs(serviceName);
        if (auditRes.data) setAuditLogs(auditRes.data);
      }
    } finally {
      setIsSaving(false);
      setEditingKey(null);
    }
  };

  const handleAddNewParam = async () => {
    if (!newKey.trim()) return;
    setIsAdding(true);
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
        const auditRes = await getMicroServiceAuditLogs(serviceName);
        if (auditRes.data) setAuditLogs(auditRes.data);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>
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
          <Tab eventKey="configs" title={`Configurations (${configs.length})`}>
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
                {showAddForm ? "Cancel" : "Add Parameter"}
              </Button>
            </div>

            {showAddForm && (
              <div className="bg-light p-3 rounded mb-3 border">
                <h6 className="fw-bold mb-2">Add New Configuration Key</h6>
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
                      onClick={handleAddNewParam}
                      disabled={isAdding || !newKey.trim()}
                    >
                      {isAdding ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center my-4">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : configs.length === 0 ? (
              <div className="text-muted text-center my-4">
                No custom configuration parameters found for this service. Click{" "}
                <strong>Add Parameter</strong> above to configure environment
                overrides.
              </div>
            ) : (
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
                  {configs.map((config) => {
                    const isSecret = config.isSecret;
                    const isRevealed = revealedSecrets[config.key];
                    const isEditing = editingKey === config.key;

                    return (
                      <tr key={config.key}>
                        <td className="fw-semibold text-break">{config.key}</td>
                        <td>
                          {isEditing ? (
                            <Form.Control
                              size="sm"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              disabled={isSaving}
                            />
                          ) : (
                            <span className="font-monospace text-break">
                              {isSecret && !isRevealed
                                ? "••••••••"
                                : config.value}
                            </span>
                          )}
                        </td>
                        <td>
                          <Badge bg="secondary">{config.type}</Badge>
                        </td>
                        <td>
                          {config.isReadOnly ? (
                            <Badge bg="dark">Read-only</Badge>
                          ) : (
                            <Badge bg="info">Editable</Badge>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            {isSecret && (
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => toggleSecret(config.key)}
                                title={
                                  isRevealed ? "Hide value" : "Reveal value"
                                }
                              >
                                {isRevealed ? (
                                  <EyeSlash size={14} />
                                ) : (
                                  <Eye size={14} />
                                )}
                              </Button>
                            )}
                            {!config.isReadOnly &&
                              (isEditing ? (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleSaveConfig(config.key)}
                                  disabled={isSaving}
                                >
                                  <Check size={16} />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handleStartEdit(config)}
                                >
                                  <PencilSquare size={14} />
                                </Button>
                              ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Tab>

          <Tab eventKey="audit" title={`Audit Trail (${auditLogs.length})`}>
            {loading ? (
              <div className="text-center my-4">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-muted text-center my-4">
                No modification history recorded yet.
              </div>
            ) : (
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
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <Badge
                          bg={
                            log.actionType === "RESTART"
                              ? "warning"
                              : log.actionType === "SCALE_CHANGE"
                                ? "primary"
                                : "info"
                          }
                        >
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
