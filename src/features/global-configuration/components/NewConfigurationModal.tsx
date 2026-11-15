import { type FC, type SubmitEvent, useId, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import {
  createConfiguration,
  type NewConfiguration,
} from "../api/ConfigurationRepository";
import type { Configuration } from "../domain/Entity/Configuration";
import { parsedValueOf } from "../domain/Entity/ConfigurationInput";
import { ValueInput } from "./ConfigurationFormModal";

const TYPES: Configuration["type"][] = [
  "string",
  "number",
  "boolean",
  "array",
  "object",
];

// The categories the server accepts, one tab each
const CATEGORIES = ["general", "security", "notification", "env"];

// Dot-separated words, as the server checks it
const KEY_FORMAT = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/;

interface Draft {
  key: string;
  type: Configuration["type"];
  category: string;
  isSecret: boolean;
  description: string;
  inputValue: string;
  boolValue: boolean;
}

const EMPTY_DRAFT: Draft = {
  key: "",
  type: "string",
  category: "general",
  isSecret: false,
  description: "",
  inputValue: "",
  boolValue: false,
};

// The setting as the value field sees it while it is typed
const configurationOf = (draft: Draft): Configuration => ({
  key: draft.key,
  value: null,
  type: draft.type,
  category: draft.category,
  requiresMfa: false,
  isSecret: draft.isSecret,
  environmentScope: "all",
  isReadOnly: false,
  targetServices: [],
});

type Submission = { configuration: NewConfiguration } | { error: string };

/** What to send, or why the form refuses it before the server does. */
const submissionOf = (draft: Draft): Submission => {
  const key = draft.key.trim();
  if (!KEY_FORMAT.test(key)) {
    return {
      error:
        "The key is dot-separated lowercase words, e.g. general.welcome_text.",
    };
  }
  // An empty number field would otherwise read as 0
  if (draft.type === "number" && !draft.inputValue.trim()) {
    return { error: "Enter a number." };
  }
  try {
    const parsed = parsedValueOf(configurationOf(draft), draft);
    if ("error" in parsed) return parsed;
    return {
      configuration: {
        key,
        value: parsed.value,
        type: draft.type,
        category: draft.category,
        isSecret: draft.isSecret,
        description: draft.description.trim() || undefined,
      },
    };
  } catch {
    // The parser message is technical: it is not shown
    return { error: "The value is not valid JSON." };
  }
};

interface DraftFieldsProps {
  draft: Draft;
  change: (fields: Partial<Draft>) => void;
}

// The key, its type, its tab and its description
const DraftFields: FC<DraftFieldsProps> = ({ draft, change }) => {
  const secretId = useId();
  return (
    <>
      <Form.Group controlId="newConfigurationKey">
        <Form.Label className="fw-bold">Key</Form.Label>
        <Form.Control
          value={draft.key}
          maxLength={100}
          autoComplete="off"
          placeholder="general.welcome_text"
          onChange={(e) => change({ key: e.target.value })}
        />
      </Form.Group>
      <div className="d-flex gap-3">
        <Form.Group controlId="newConfigurationType" className="flex-fill">
          <Form.Label className="fw-bold">Type</Form.Label>
          <Form.Select
            value={draft.type}
            onChange={(e) =>
              change({
                type:
                  TYPES.find((type) => type === e.target.value) ?? draft.type,
                inputValue: "",
              })
            }
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="newConfigurationCategory" className="flex-fill">
          <Form.Label className="fw-bold">Category</Form.Label>
          <Form.Select
            value={draft.category}
            onChange={(e) => change({ category: e.target.value })}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </div>
      <Form.Group controlId="newConfigurationDescription">
        <Form.Label className="fw-bold">Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={draft.description}
          onChange={(e) => change({ description: e.target.value })}
        />
      </Form.Group>
      <Form.Check
        id={secretId}
        type="checkbox"
        label="Secret: stored encrypted, never shown again"
        checked={draft.isSecret}
        onChange={(e) => change({ isSecret: e.target.checked })}
      />
    </>
  );
};

export interface NewConfigurationModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (configuration: Configuration) => void;
}

/** Creates a setting (EV-18 lot C.3), for whoever holds configurations::create. */
export const NewConfigurationModal: FC<NewConfigurationModalProps> = (
  props,
) => {
  const { show, onClose, onCreated } = props;
  const titleId = useId();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const change = (fields: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...fields }));

  const close = () => {
    setDraft(EMPTY_DRAFT);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submission = submissionOf(draft);
    if ("error" in submission) {
      setError(submission.error);
      return;
    }
    setIsSaving(true);
    const response = await createConfiguration(submission.configuration);
    setIsSaving(false);
    if (response.errorCode || !response.data) {
      setError(response.message || "The setting could not be created.");
      return;
    }
    onCreated(response.data);
    close();
  };

  return (
    <Modal aria-labelledby={titleId} show={show} onHide={close}>
      <Modal.Header closeButton>
        <Modal.Title id={titleId}>New configuration</Modal.Title>
      </Modal.Header>
      <Form noValidate onSubmit={(e) => void handleSubmit(e)}>
        <Modal.Body className="d-flex flex-column gap-3">
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <DraftFields draft={draft} change={change} />
          <ValueInput
            config={configurationOf(draft)}
            input={draft}
            setInputValue={(inputValue) => change({ inputValue })}
            setBoolValue={(boolValue) => change({ boolValue })}
          />
          <Form.Text muted>
            No service reads a new key until its code does: creating it has no
            effect before then.
          </Form.Text>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? (
              <Spinner animation="border" size="sm" className="me-1" />
            ) : null}
            Create
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
