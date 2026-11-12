import { type FC, type SubmitEvent, useEffect, useId, useState } from "react";
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

type Due = { instant: Date } | { problem: string };

/** The instant typed, or why there is none. */
const readDue = (input: string, zone: string, pick: number): Due => {
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

/** The value to plan: the switch, or a whole number typed. */
const plannedValueOf = (
  config: Configuration,
  typed: { value: string; enabled: boolean },
): { value: ConfigurationValue } | { problem: string } => {
  if (config.type === "boolean") return { value: typed.enabled };
  const n = Number(typed.value);
  if (!typed.value.trim() || !Number.isInteger(n)) {
    return { problem: `Enter ${config.accepts?.text ?? "a whole number"}.` };
  }
  return { value: n };
};

interface PlanInput {
  config: Configuration;
  typed: { value: string; enabled: boolean };
  due: Due;
  now: () => Date;
}

/** The value and date to plan, or the first reason they cannot be. */
const planOf = (
  input: PlanInput,
): { value: ConfigurationValue; dueAt: string } | { problem: string } => {
  const planned = plannedValueOf(input.config, input.typed);
  if ("problem" in planned) return planned;
  const { due } = input;
  if ("problem" in due) return { problem: due.problem };
  if (due.instant.getTime() <= input.now().getTime()) {
    return { problem: "The date of the change must be in the future." };
  }
  return { value: planned.value, dueAt: due.instant.toISOString() };
};

interface ValueFieldProps {
  config: Configuration;
  fieldId: string;
  typed: { value: string; enabled: boolean };
  setValue: (value: string) => void;
  setEnabled: (enabled: boolean) => void;
}

const ValueField: FC<ValueFieldProps> = (props) => {
  const { config, fieldId, typed, setValue, setEnabled } = props;
  if (config.type === "boolean") {
    return (
      <Form.Check
        type="switch"
        id={fieldId}
        label={typed.enabled ? "New value: enabled" : "New value: disabled"}
        checked={typed.enabled}
        onChange={(e) => setEnabled(e.target.checked)}
      />
    );
  }
  return (
    <Form.Group controlId={fieldId}>
      <Form.Label className="fw-semibold mb-1">New value</Form.Label>
      <Form.Control
        type="number"
        inputMode="numeric"
        min={config.accepts?.min}
        max={config.accepts?.max}
        value={typed.value}
        onChange={(e) => setValue(e.target.value)}
      />
      {config.accepts?.text ? (
        <Form.Text>Accepts {config.accepts.text}.</Form.Text>
      ) : null}
    </Form.Group>
  );
};

interface DueFieldProps {
  idPrefix: string;
  timeZone: string;
  dueInput: string;
  inputZone: string;
  pick: number;
  onInput: (input: string) => void;
  onPick: (pick: number) => void;
  onSwitchZone: (zone: string) => void;
}

const ZoneSwitch: FC<
  Pick<DueFieldProps, "timeZone" | "inputZone" | "onSwitchZone">
> = ({ timeZone, inputZone, onSwitchZone }) => (
  <ButtonGroup size="sm" aria-label="Time zone of the date">
    {["UTC", timeZone].map((zone) => (
      <Button
        key={zone}
        variant={zone === inputZone ? "secondary" : "outline-secondary"}
        aria-pressed={zone === inputZone}
        onClick={() => onSwitchZone(zone)}
      >
        {isUtc(zone) ? "UTC" : cityOf(zone)}
      </Button>
    ))}
  </ButtonGroup>
);

// A time that comes twice: which of the two instants
const InstantPick: FC<
  Pick<DueFieldProps, "idPrefix" | "inputZone" | "pick" | "onPick"> & {
    instants: Date[];
  }
> = ({ idPrefix, inputZone, pick, onPick, instants }) => (
  <fieldset className="mt-2">
    <legend className="fs-6 mb-1">
      This time comes twice in {cityOf(inputZone)}: clocks move back that night.
    </legend>
    {instants.map((instant, index) => (
      <Form.Check
        key={instant.toISOString()}
        type="radio"
        id={`${idPrefix}-pick-${index}`}
        name={`${idPrefix}-pick`}
        checked={pick === index}
        onChange={() => onPick(index)}
        label={`${index === 0 ? "First" : "Second"} time, ${formatOffset(offsetMinutes(instant, inputZone))} (${formatUtc(instant)})`}
      />
    ))}
  </fieldset>
);

const DueField: FC<DueFieldProps> = (props) => {
  const { idPrefix, timeZone, dueInput, inputZone, pick } = props;
  const due = readDue(dueInput, inputZone, pick);
  const typed = instantsOfInput(dueInput, inputZone);
  return (
    <Form.Group controlId={`${idPrefix}-due`}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
        <Form.Label className="fw-semibold mb-0">
          Apply on ({isUtc(inputZone) ? "UTC" : cityOf(inputZone)})
        </Form.Label>
        {!isUtc(timeZone) && <ZoneSwitch {...props} />}
      </div>
      <Form.Control
        type="datetime-local"
        value={dueInput}
        onChange={(e) => props.onInput(e.target.value)}
      />
      {typed.kind === "ambiguous" && (
        <InstantPick {...props} instants={typed.instants} />
      )}
      <Form.Text>
        {"instant" in due
          ? `${describeInstant(due.instant, timeZone)}.`
          : due.problem}{" "}
        Applied within a minute of this time.
      </Form.Text>
    </Form.Group>
  );
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

// A planned change is saved again; a new one is scheduled
const submitLabelOf = (planned: boolean) =>
  planned ? "Save the planned change" : "Schedule";

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

  const due = readDue(dueInput, inputZone, pick);
  // Switching keeps the instant and shows it in the other time zone
  const switchZone = (zone: string) => {
    if ("instant" in due) setDueInput(inputOf(due.instant, zone));
    setInputZone(zone);
    setPick(0);
  };

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const plan = planOf({ config, typed: { value, enabled }, due, now });
    if ("problem" in plan) {
      setError(plan.problem);
      return;
    }
    setBusy(true);
    const response = change
      ? await rescheduleChange(change.id, plan.value, plan.dueAt)
      : await scheduleChange(config.key, plan.value, plan.dueAt);
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
          <ValueField
            config={config}
            fieldId={`${titleId}-value`}
            typed={{ value, enabled }}
            setValue={setValue}
            setEnabled={setEnabled}
          />
          <DueField
            idPrefix={titleId}
            timeZone={timeZone}
            dueInput={dueInput}
            inputZone={inputZone}
            pick={pick}
            onInput={(input) => {
              setDueInput(input);
              setPick(0);
            }}
            onPick={setPick}
            onSwitchZone={switchZone}
          />
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
            ) : (
              submitLabelOf(change !== undefined)
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
