import { type FC, type SubmitEvent, useEffect, useId, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import {
  type AcceptedValues,
  type Configuration,
  type ConfigurationValue,
  valueKindOf,
} from "../domain/Entity/Configuration";

/** A whole number within the bounds the server sent; true without bounds. */
const isWithinAccepted = (value: number, accepts?: AcceptedValues) =>
  accepts?.min === undefined ||
  accepts.max === undefined ||
  (Number.isInteger(value) && value >= accepts.min && value <= accepts.max);

/** Time zones the browser knows, offered while typing one. */
// A secret is typed hidden; a number in a number field
const inputTypeOf = (config: Configuration) => {
  if (config.isSecret) return "password";
  return config.type === "number" ? "number" : "text";
};

// A secret is never shown back: the field asks for a new value
const placeholderOf = (config: Configuration) => {
  if (config.isSecret) return "New value";
  return config.accepts?.format === "timeSpan" ? "20:00-07:00" : "Enter value";
};

const knownTimeZones = (): string[] => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
};

// A value as text; a list or an object, even under another type, as JSON
const textOf = (value: ConfigurationValue): string => {
  if (typeof value === "string") return value;
  if (value === null) return "";
  // A number or a boolean reads the same as JSON (a JSON value is never NaN)
  return typeof value === "object"
    ? JSON.stringify(value, null, 2)
    : JSON.stringify(value);
};

// The value as the field shows it: a secret is replaced, not edited, as
// the API only sends a mask for it
const fieldValueOf = (config: Configuration): string => {
  if (config.isSecret) return "";
  if (config.type === "object" || config.type === "array") {
    return JSON.stringify(config.value, null, 2);
  }
  return textOf(config.value);
};

type ParsedValue = { value: ConfigurationValue } | { error: string };

const numberOf = (input: string, accepts?: AcceptedValues): ParsedValue => {
  const num = Number(input);
  if (Number.isNaN(num)) return { error: "Please enter a valid number." };
  // The server refuses it too; saying it here spares a failed save
  if (!isWithinAccepted(num, accepts)) {
    return { error: `Enter ${accepts?.text}.` };
  }
  return { value: num };
};

// Throws on text that is not JSON
const jsonOf = (type: "array" | "object", input: string): ParsedValue => {
  const parsed = JSON.parse(input);
  if (type === "array" && !Array.isArray(parsed)) {
    return {
      error: 'Value must be a valid JSON array (e.g. ["val1", "val2"]).',
    };
  }
  if (
    type === "object" &&
    (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
  ) {
    return {
      error: 'Value must be a valid JSON object (e.g. { "key": "value" }).',
    };
  }
  return { value: parsed };
};

interface FormInput {
  inputValue: string;
  boolValue: boolean;
}

/** The value to save from the form, or why it is refused. */
const parsedValueOf = (
  config: Configuration,
  input: FormInput,
): ParsedValue => {
  const { inputValue, boolValue } = input;
  if (config.isSecret && config.type !== "boolean" && !inputValue.trim()) {
    return { error: "Enter a new value for this secret." };
  }
  if (config.type === "boolean") return { value: boolValue };
  if (config.type === "number") return numberOf(inputValue, config.accepts);
  if (config.type === "array" || config.type === "object") {
    return jsonOf(config.type, inputValue);
  }
  return { value: inputValue };
};

const ConfigurationFacts: FC<{ config: Configuration }> = ({ config }) => (
  <>
    <div>
      <div className="fw-bold text-muted small">KEY</div>
      <div className="fs-5 fw-semibold">{config.key}</div>
    </div>

    {config.description ? (
      <div>
        <div className="fw-bold text-muted small">DESCRIPTION</div>
        <div>{config.description}</div>
      </div>
    ) : null}

    <div>
      <div className="fw-bold text-muted small">TYPE</div>
      <span className="badge bg-secondary text-uppercase">{config.type}</span>
    </div>
  </>
);

// Why a change may be refused or have no effect
const ConfigurationNotices: FC<{ config: Configuration }> = ({ config }) => (
  <>
    {config.isReadOnly ? (
      <Alert variant="warning" className="py-2 small mb-0">
        This configuration is marked as <strong>read-only</strong>. It cannot be
        updated.
      </Alert>
    ) : null}

    {config.isApplied === false && (
      <Alert variant="secondary" className="py-2 small mb-0">
        No service reads this configuration yet: saving it has no effect.
      </Alert>
    )}

    {config.requiresMfa ? (
      <Alert variant="warning" className="py-2 small mb-0">
        Changing this setting needs a second-factor check, which is not
        available yet: the server refuses the change.
      </Alert>
    ) : null}
  </>
);

interface ValueInputProps {
  config: Configuration;
  input: FormInput;
  setInputValue: (value: string) => void;
  setBoolValue: (value: boolean) => void;
}

const ValueInput: FC<ValueInputProps> = (props) => {
  const { config, input, setInputValue, setBoolValue } = props;
  const timeZonesId = useId();
  const booleanSwitchId = useId();
  const valueKind = valueKindOf(config.type);
  const isTimeZone = config.accepts?.format === "timeZone";
  return (
    <Form.Group controlId="configValue">
      <Form.Label className="fw-bold">Value</Form.Label>
      {valueKind === "switch" && (
        <Form.Check
          type="switch"
          id={booleanSwitchId}
          label={input.boolValue ? "Enabled" : "Disabled"}
          checked={input.boolValue}
          disabled={config.isReadOnly}
          onChange={(e) => setBoolValue(e.target.checked)}
        />
      )}
      {valueKind === "json" && (
        <Form.Control
          as="textarea"
          rows={6}
          value={input.inputValue}
          disabled={config.isReadOnly}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            config.type === "array"
              ? '[\n  "service_a",\n  "service_b"\n]'
              : '{\n  "key": "value"\n}'
          }
          style={{ fontFamily: "monospace" }}
        />
      )}
      {valueKind === "field" && (
        <Form.Control
          type={inputTypeOf(config)}
          value={input.inputValue}
          disabled={config.isReadOnly}
          autoComplete={config.isSecret ? "new-password" : "off"}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholderOf(config)}
          min={config.accepts?.min}
          max={config.accepts?.max}
          step={config.accepts?.min === undefined ? undefined : 1}
          list={isTimeZone ? timeZonesId : undefined}
        />
      )}
      {isTimeZone && (
        <datalist id={timeZonesId}>
          {knownTimeZones().map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      )}
      {config.accepts && config.type !== "boolean" && (
        <Form.Text muted>Accepted: {config.accepts.text}.</Form.Text>
      )}
      {config.isSecret ? (
        <Form.Text muted>
          The current value is hidden. Enter a new value to replace it.
        </Form.Text>
      ) : null}
    </Form.Group>
  );
};

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
  const titleId = useId();
  const [inputValue, setInputValue] = useState<string>("");
  const [boolValue, setBoolValue] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setValidationError(null);
      if (config.type === "boolean") {
        setBoolValue(Boolean(config.value));
      } else {
        setInputValue(fieldValueOf(config));
      }
    }
  }, [config]);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!config) return;
    try {
      const parsed = parsedValueOf(config, { inputValue, boolValue });
      if ("error" in parsed) {
        setValidationError(parsed.error);
        return;
      }
      onConfigSubmit(config.key, parsed.value);
      onClose();
    } catch {
      // The parser message is technical: it is not shown
      setValidationError("The value is not valid JSON.");
    }
  };

  if (!config) return null;

  return (
    <Modal aria-labelledby={titleId} show={showModal} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title id={titleId}>Edit Configuration</Modal.Title>
      </Modal.Header>

      {/* The bounds of the field help the input; the form says what it
          accepts in its own words rather than with the browser bubble */}
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Body className="d-flex flex-column gap-3">
          <ConfigurationFacts config={config} />

          <hr className="my-1" />

          {validationError ? (
            <Alert variant="danger">{validationError}</Alert>
          ) : null}

          <ConfigurationNotices config={config} />

          <ValueInput
            config={config}
            input={{ inputValue, boolValue }}
            setInputValue={setInputValue}
            setBoolValue={setBoolValue}
          />
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
