import { type FC, useEffect, useId, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import {
  rescheduleChange,
  scheduleChange,
} from "../api/ScheduledChangeRepository";
import type {
  Configuration,
  ConfigurationValue,
} from "../domain/Entity/Configuration";
import {
  formatLocal,
  instantOfUtcInput,
  type ScheduledChange,
  utcInputOf,
} from "../domain/Entity/ScheduledChange";

const HOUR_MS = 60 * 60 * 1000;

/** Tomorrow at the next full hour, in UTC: a date to start from. */
const defaultDueInput = (now: Date) =>
  utcInputOf(
    new Date(Math.ceil((now.getTime() + 24 * HOUR_MS) / HOUR_MS) * HOUR_MS),
  );

export interface ScheduleChangeModalProps {
  /** The setting to change; the dialog is shown while set. */
  config?: Configuration;
  /** The planned change being edited, if any. */
  change?: ScheduledChange;
  onClose: () => void;
  onSaved: (change: ScheduledChange) => void;
  now?: () => Date;
}

/**
 * Plans a change of a setting users notice for a date and time in UTC
 * (EV-115 lot B), or edits a planned one. The local time of the browser is
 * shown beside it; nothing changes before the date.
 */
export const ScheduleChangeModal: FC<ScheduleChangeModalProps> = ({
  config,
  change,
  onClose,
  onSaved,
  now = () => new Date(),
}) => {
  const titleId = useId();
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [dueInput, setDueInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    const start = change ? change.newValue : config.value;
    setValue(String(start ?? ""));
    setEnabled(Boolean(start));
    setDueInput(
      change ? utcInputOf(change.dueAt) : defaultDueInput(new Date()),
    );
    setError(null);
  }, [config, change]);

  if (!config) return null;

  const isBoolean = config.type === "boolean";
  const dueAt = instantOfUtcInput(dueInput);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let newValue: ConfigurationValue = enabled;
    if (!isBoolean) {
      const n = Number(value);
      if (!value.trim() || !Number.isInteger(n)) {
        setError(`Enter ${config.accepts?.text ?? "a whole number"}.`);
        return;
      }
      newValue = n;
    }
    if (!dueAt) {
      setError("Enter a date and a time.");
      return;
    }
    if (new Date(dueAt).getTime() <= now().getTime()) {
      setError("The date of the change must be in the future.");
      return;
    }
    setBusy(true);
    const response = change
      ? await rescheduleChange(change.id, newValue, dueAt)
      : await scheduleChange(config.key, newValue, dueAt);
    setBusy(false);
    if (response.errorCode || !response.data) {
      setError(response.message || "The change could not be planned.");
      return;
    }
    onSaved(response.data);
  };

  return (
    <Modal
      show
      onHide={busy ? undefined : onClose}
      aria-labelledby={titleId}
      centered
    >
      <Modal.Header closeButton={!busy}>
        <Modal.Title id={titleId} as="h2" className="fs-5">
          {change ? "Edit the planned change" : "Schedule a change"}
        </Modal.Title>
      </Modal.Header>
      <Form noValidate onSubmit={submit}>
        <Modal.Body className="d-flex flex-column gap-3">
          <div>
            <div className="fw-bold text-muted small">SETTING</div>
            <div className="fw-semibold">{config.key}</div>
          </div>
          {isBoolean ? (
            <Form.Check
              type="switch"
              id={`${titleId}-value`}
              label={enabled ? "New value: enabled" : "New value: disabled"}
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          ) : (
            <Form.Group controlId={`${titleId}-value`}>
              <Form.Label className="fw-semibold mb-1">New value</Form.Label>
              <Form.Control
                type="number"
                inputMode="numeric"
                min={config.accepts?.min}
                max={config.accepts?.max}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              {config.accepts?.text && (
                <Form.Text>Accepts {config.accepts.text}.</Form.Text>
              )}
            </Form.Group>
          )}
          <Form.Group controlId={`${titleId}-due`}>
            <Form.Label className="fw-semibold mb-1">Apply on (UTC)</Form.Label>
            <Form.Control
              type="datetime-local"
              value={dueInput}
              onChange={(e) => setDueInput(e.target.value)}
            />
            <Form.Text>
              {dueAt
                ? `Your time: ${formatLocal(dueAt)}.`
                : "Enter a date and a time."}{" "}
              Applied within a minute of this time.
            </Form.Text>
          </Form.Group>
          {error && (
            <Alert variant="danger" className="mb-0 py-2">
              {error}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? (
              <Spinner size="sm" animation="border" />
            ) : change ? (
              "Save the planned change"
            ) : (
              "Schedule"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
