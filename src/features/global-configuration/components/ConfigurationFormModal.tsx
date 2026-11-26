import {
  isUnsavedInput,
  useDiscardConfirmation,
} from "@variamosple/variamos-components";
import {
  type FC,
  type SubmitEvent,
  useCallback,
  useEffect,
  useId,
  useState,
} from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { ClosingFooter } from "@/shared/components/FormModal/ClosingFooter";
import {
  type Configuration,
  type ConfigurationValue,
  valueKindOf,
} from "../domain/Entity/Configuration";
import {
  type FormInput,
  parsedValueOf,
} from "../domain/Entity/ConfigurationInput";

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
export const textOf = (value: ConfigurationValue): string => {
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

export const ValueInput: FC<ValueInputProps> = (props) => {
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

  // The field shows the value of the setting: when it opens, and again
  // when its edit is dropped, so that it never reopens with stale text
  const fill = useCallback((setting?: Configuration) => {
    if (setting) {
      setValidationError(null);
      if (setting.type === "boolean") {
        setBoolValue(Boolean(setting.value));
      } else {
        setInputValue(fieldValueOf(setting));
      }
    }
  }, []);

  useEffect(() => fill(config), [config, fill]);

  const close = () => {
    fill(config);
    onClose();
  };
  // Closing with an edited value asks first (UX-08)
  const closing = useDiscardConfirmation({
    holdsInput: showModal && config !== undefined && isEdited(config),
    onClose: close,
  });

  function isEdited(setting: Configuration) {
    return setting.type === "boolean"
      ? Boolean(setting.value) !== boolValue
      : isUnsavedInput({ value: fieldValueOf(setting) }, { value: inputValue });
  }

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
    <Modal
      aria-labelledby={titleId}
      show={showModal}
      onHide={closing.requestClose}
    >
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

        <ClosingFooter closing={closing}>
          <Button
            type="button"
            variant="secondary"
            onClick={closing.requestClose}
          >
            Cancel
          </Button>

          <Button variant="primary" type="submit" disabled={config.isReadOnly}>
            Apply Changes
          </Button>
        </ClosingFooter>
      </Form>
    </Modal>
  );
};
