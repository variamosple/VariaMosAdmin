import { type FC, useId, useMemo, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import { updateMyTimeZone } from "@/shared/api/PreferencesRepository";
import { useToast } from "@/shared/context/ToastContext";
import { browserTimeZone, knownTimeZones } from "@/shared/domain/TimeZone";
import { useTimeZone } from "@/shared/hooks/useTimeZone";

// The empty choice: the time zone of the browser, wherever it is
const BROWSER = "";

/**
 * The time zone the interface shows times in, beside UTC (EV-115 lot C).
 * Unset, it is the browser's; the country and the language of the site are
 * other settings.
 */
export const TimeZoneSetting: FC = () => {
  const selectId = useId();
  const { chosen, setChosen } = useTimeZone();
  const browser = browserTimeZone();
  const zones = useMemo(knownTimeZones, []);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(BROWSER);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { pushToast } = useToast();

  const startEditing = () => {
    setDraft(chosen ?? BROWSER);
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    const response = await updateMyTimeZone(draft === BROWSER ? null : draft);
    setBusy(false);
    if (response.errorCode || !response.data) {
      setError(response.message || "The time zone could not be saved.");
      return;
    }
    setChosen(response.data.timeZone);
    setEditing(false);
    pushToast({
      title: "Time zone saved",
      message: "Times are shown in this time zone, beside UTC.",
      variant: "success",
    });
  };

  if (!editing) {
    return (
      <>
        <span className="fw-bold">Time zone: </span>
        {chosen ?? `Browser time (${browser})`}
        <Button
          className="ms-1"
          variant="primary"
          size="sm"
          onClick={startEditing}
        >
          Change
        </Button>
      </>
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      <Form.Label htmlFor={selectId} className="fw-bold mb-0">
        Time zone
      </Form.Label>
      <Form.Select
        id={selectId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={busy}
      >
        <option value={BROWSER}>Browser time ({browser})</option>
        {zones.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </Form.Select>
      <Form.Text>Times stay in UTC; this zone is shown beside them.</Form.Text>
      {error && (
        <Alert variant="danger" className="mb-0 py-2">
          {error}
        </Alert>
      )}
      <div className="d-flex gap-2">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? <Spinner size="sm" animation="border" /> : "Save"}
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => setEditing(false)}
          disabled={busy}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
