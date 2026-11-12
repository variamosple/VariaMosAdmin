import { type FC, useEffect, useId, useState } from "react";
import {
  Alert,
  Button,
  ButtonGroup,
  Form,
  Modal,
  Spinner,
} from "react-bootstrap";
import {
  cityOf,
  describeInstant,
  formatOffset,
  formatUtc,
  inputOf,
  instantsOfInput,
  offsetMinutes,
} from "@/shared/domain/TimeZone";
import {
  rescheduleChange,
  scheduleChange,
} from "../api/ScheduledChangeRepository";
import type {
  Configuration,
  ConfigurationValue,
} from "../domain/Entity/Configuration";
import type { ScheduledChange } from "../domain/Entity/ScheduledChange";

const HOUR_MS = 60 * 60 * 1000;

/** Tomorrow at the next full hour: a date to start from. */
const defaultDue = (now: Date) =>
  new Date(Math.ceil((now.getTime() + 24 * HOUR_MS) / HOUR_MS) * HOUR_MS);

const isUtc = (zone: string) => zone === "UTC" || zone === "Etc/UTC";

/** The instant typed, or why there is none. */
const readDue = (
  input: string,
  zone: string,
  pick: number,
): { instant: Date } | { problem: string } => {
  const typed = instantsOfInput(input, zone);
  switch (typed.kind) {
    case "single":
      return { instant: typed.instant };
    case "ambiguous":
      return { instant: typed.instants[pick] ?? typed.instants[0] };
    case "gap":
      return {
        problem: `This time does not exist in ${cityOf(zone)}: clocks move forward that night.`,
      };
    default:
      return { problem: "Enter a date and a time." };
  }
};

export interface ScheduleChangeModalProps {
  /** The setting to change; the dialog is shown while set. */
  config?: Configuration;
  /** The planned change being edited, if any. */
  change?: ScheduledChange;
  onClose: () => void;
  onSaved: (change: ScheduledChange) => void;
  /** The time zone of the profile, or the browser's; UTC can be typed too. */
  timeZone?: string;
  now?: () => Date;
}

/**
 * Plans a change of a setting users notice for a date and time in UTC
 * (EV-115 lot B), or edits a planned one. The local time of the browser is
 * shown beside it; nothing changes before the date.
 */
const currentDate = () => new Date();

export const ScheduleChangeModal: FC<ScheduleChangeModalProps> = ({
  config,
  change,
  onClose,
  onSaved,
  timeZone = "UTC",
  now = currentDate,
}) => {
  const titleId = useId();
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [dueInput, setDueInput] = useState("");
  // The time is typed in UTC or in the time zone of the profile
  const [inputZone, setInputZone] = useState("UTC");
  // Which of the two instants of a time that comes twice
  const [pick, setPick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    const start = change ? change.newValue : config.value;
    setValue(String(start ?? ""));
    setEnabled(Boolean(start));
    setDueInput(
      inputOf(change ? new Date(change.dueAt) : defaultDue(new Date()), "UTC"),
    );
    setInputZone("UTC");
    setPick(0);
    setError(null);
  }, [config, change]);

  if (!config) return null;

  const isBoolean = config.type === "boolean";
  const due = readDue(dueInput, inputZone, pick);
  const typed = instantsOfInput(dueInput, inputZone);
  // Switching keeps the instant and shows it in the other time zone
  const switchZone = (zone: string) => {
    if ("instant" in due) setDueInput(inputOf(due.instant, zone));
    setInputZone(zone);
    setPick(0);
  };

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
    if ("problem" in due) {
      setError(due.problem);
      return;
    }
    const dueAt = due.instant.toISOString();
    if (due.instant.getTime() <= now().getTime()) {
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
              {config.accepts?.text ? (
                <Form.Text>Accepts {config.accepts.text}.</Form.Text>
              ) : null}
            </Form.Group>
          )}
          <Form.Group controlId={`${titleId}-due`}>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
              <Form.Label className="fw-semibold mb-0">
                Apply on ({isUtc(inputZone) ? "UTC" : cityOf(inputZone)})
              </Form.Label>
              {!isUtc(timeZone) && (
                <ButtonGroup size="sm" aria-label="Time zone of the date">
                  {["UTC", timeZone].map((zone) => (
                    <Button
                      key={zone}
                      variant={
                        zone === inputZone ? "secondary" : "outline-secondary"
                      }
                      aria-pressed={zone === inputZone}
                      onClick={() => switchZone(zone)}
                    >
                      {isUtc(zone) ? "UTC" : cityOf(zone)}
                    </Button>
                  ))}
                </ButtonGroup>
              )}
            </div>
            <Form.Control
              type="datetime-local"
              value={dueInput}
              onChange={(e) => {
                setDueInput(e.target.value);
                setPick(0);
              }}
            />
            {typed.kind === "ambiguous" && (
              <fieldset className="mt-2">
                <legend className="fs-6 mb-1">
                  This time comes twice in {cityOf(inputZone)}: clocks move back
                  that night.
                </legend>
                {typed.instants.map((instant, index) => (
                  <Form.Check
                    key={instant.toISOString()}
                    type="radio"
                    id={`${titleId}-pick-${index}`}
                    name={`${titleId}-pick`}
                    checked={pick === index}
                    onChange={() => setPick(index)}
                    label={`${index === 0 ? "First" : "Second"} time, ${formatOffset(offsetMinutes(instant, inputZone))} (${formatUtc(instant)})`}
                  />
                ))}
              </fieldset>
            )}
            <Form.Text>
              {"instant" in due
                ? `${describeInstant(due.instant, timeZone)}.`
                : due.problem}{" "}
              Applied within a minute of this time.
            </Form.Text>
          </Form.Group>
          {error ? (
            <Alert variant="danger" className="mb-0 py-2">
              {error}
            </Alert>
          ) : null}
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
