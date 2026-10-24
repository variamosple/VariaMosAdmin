import { type FC, type FormEvent, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import type { BugUserRef } from "../../domain/Bug";

interface BugAssigneesFormProps {
  assignees: BugUserRef[];
  candidates: BugUserRef[];
  // Resolves to an error message, or null when the assignees were saved
  onSave: (userIds: string[]) => Promise<string | null>;
}

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

export const BugAssigneesForm: FC<BugAssigneesFormProps> = ({
  assignees,
  candidates,
  onSave,
}) => {
  const current = assignees.map((user) => user.id);
  const [selected, setSelected] = useState<string[]>(current);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (candidates.length === 0) return null;

  const toggle = (id: string) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id],
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    const failure = await onSave(selected);
    setIsSaving(false);
    if (failure) setError(failure);
  };

  return (
    <Form onSubmit={handleSubmit} className="border rounded p-3 mb-3">
      <fieldset disabled={isSaving}>
        <legend className="h6 mb-2">Assign administrators</legend>
        {error && <Alert variant="danger">{error}</Alert>}
        {candidates.map((user) => (
          <Form.Check
            key={user.id}
            id={`bug-assignee-${user.id}`}
            type="checkbox"
            label={user.name}
            checked={selected.includes(user.id)}
            onChange={() => toggle(user.id)}
          />
        ))}
        <Form.Text>New assignees are notified in the application.</Form.Text>
        <div className="text-end">
          <Button type="submit" size="sm" disabled={sameIds(selected, current)}>
            {isSaving ? "Saving..." : "Save assignees"}
          </Button>
        </div>
      </fieldset>
    </Form>
  );
};
