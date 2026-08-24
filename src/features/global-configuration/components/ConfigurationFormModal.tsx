import { type FC, useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import type {
  Configuration,
  ConfigurationValue,
} from "../domain/Entity/Configuration";

export interface ConfigurationFormModalProps {
  showModal: boolean;
  onClose: () => void;
  config?: Configuration;
  onConfigSubmit: (key: string, value: ConfigurationValue) => void;
}

export const ConfigurationFormModal: FC<ConfigurationFormModalProps> = ({
  showModal,
  onClose,
  config,
  onConfigSubmit,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [boolValue, setBoolValue] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setValidationError(null);
      if (config.type === "boolean") {
        setBoolValue(Boolean(config.value));
      } else if (config.type === "object" || config.type === "array") {
        setInputValue(JSON.stringify(config.value, null, 2));
      } else {
        setInputValue(String(config.value ?? ""));
      }
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    let finalValue: ConfigurationValue;

    try {
      if (config.type === "boolean") {
        finalValue = boolValue;
      } else if (config.type === "number") {
        const num = Number(inputValue);
        if (Number.isNaN(num)) {
          setValidationError("Please enter a valid number.");
          return;
        }
        finalValue = num;
      } else if (config.type === "array" || config.type === "object") {
        const parsed = JSON.parse(inputValue);
        if (config.type === "array" && !Array.isArray(parsed)) {
          setValidationError(
            'Value must be a valid JSON array (e.g. ["val1", "val2"]).',
          );
          return;
        }
        if (
          config.type === "object" &&
          (typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed))
        ) {
          setValidationError(
            'Value must be a valid JSON object (e.g. { "key": "value" }).',
          );
          return;
        }
        finalValue = parsed;
      } else {
        finalValue = inputValue;
      }

      onConfigSubmit(config.key, finalValue);
      onClose();
    } catch (err) {
      setValidationError(`Invalid JSON format: ${(err as Error).message}`);
    }
  };

  if (!config) return null;

  return (
    <Modal show={showModal} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Configuration</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="d-flex flex-column gap-3">
          <div>
            <div className="fw-bold text-muted small">KEY</div>
            <div className="fs-5 fw-semibold">{config.key}</div>
          </div>

          {config.description && (
            <div>
              <div className="fw-bold text-muted small">DESCRIPTION</div>
              <div>{config.description}</div>
            </div>
          )}

          <div>
            <div className="fw-bold text-muted small">TYPE</div>
            <span className="badge bg-secondary text-uppercase">
              {config.type}
            </span>
          </div>

          <hr className="my-1" />

          {validationError && <Alert variant="danger">{validationError}</Alert>}

          {config.isReadOnly && (
            <Alert variant="warning" className="py-2 small mb-0">
              This configuration is marked as <strong>read-only</strong>. It
              cannot be updated.
            </Alert>
          )}

          {config.requiresMfa && (
            <Alert variant="info" className="py-2 small mb-0">
              ℹ️ Modifying this configuration requires Multi-Factor
              Authentication upon saving.
            </Alert>
          )}

          <Form.Group controlId="configValue">
            <Form.Label className="fw-bold">Value</Form.Label>
            {config.type === "boolean" ? (
              <Form.Check
                type="switch"
                id="bool-switch"
                label={boolValue ? "Enabled" : "Disabled"}
                checked={boolValue}
                disabled={config.isReadOnly}
                onChange={(e) => setBoolValue(e.target.checked)}
              />
            ) : config.type === "object" || config.type === "array" ? (
              <Form.Control
                as="textarea"
                rows={6}
                value={inputValue}
                disabled={config.isReadOnly}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  config.type === "array"
                    ? '[\n  "service_a",\n  "service_b"\n]'
                    : '{\n  "key": "value"\n}'
                }
                style={{ fontFamily: "monospace" }}
              />
            ) : (
              <Form.Control
                type={config.type === "number" ? "number" : "text"}
                value={inputValue}
                disabled={config.isReadOnly}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter value"
              />
            )}
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button variant="primary" type="submit" disabled={config.isReadOnly}>
            Apply Changes
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
