import { isUnsavedInput } from "@variamosple/variamos-components";
import { type FC, type SubmitEvent, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { useReportedInput } from "@/shared/hooks/useReportedInput";
import {
  githubEffect,
  nextStatuses,
  statusLabel,
} from "../../domain/BugStatus";

interface BugStatusFormProps {
  status: string;
  // Resolves to an error message, or null when the status changed
  onChangeStatus: (status: string, comment?: string) => Promise<string | null>;
  /** Told whether a status or a comment is chosen and not saved yet. */
  onHoldsInputChange?: (holdsInput: boolean) => void;
}

export const BugStatusForm: FC<BugStatusFormProps> = ({
  status,
  onChangeStatus,
  onHoldsInputChange,
}) => {
  const options = nextStatuses(status);
  const [target, setTarget] = useState(options[0] ?? "");
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useReportedInput(
    isUnsavedInput(
      { target: options[0] ?? "", comment: "" },
      { target, comment },
    ),
    onHoldsInputChange,
  );

  if (options.length === 0) return null;

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    const failure = await onChangeStatus(target, comment.trim() || undefined);
    setIsSaving(false);
    if (failure) {
      setError(failure);
    } else {
      setComment("");
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="border rounded p-3 mb-3">
      <h6 className="mb-2">Change status</h6>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <Form.Group className="mb-2" controlId="bugNewStatus">
        <Form.Label>New status</Form.Label>
        <Form.Select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={isSaving}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {statusLabel(option)}
            </option>
          ))}
        </Form.Select>
        <Form.Text>{githubEffect(status, target)}</Form.Text>
      </Form.Group>
      <Form.Group className="mb-2" controlId="bugStatusComment">
        <Form.Label>Comment (optional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSaving}
        />
      </Form.Group>
      <div className="text-end">
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? "Updating..." : "Update status"}
        </Button>
      </div>
    </Form>
  );
};
