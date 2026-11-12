import { type FC, useId, useMemo, useState } from "react";
import { Alert, Button, Form, ListGroup, Spinner } from "react-bootstrap";
import { updateMyTimeZone } from "@/shared/api/PreferencesRepository";
import { useToast } from "@/shared/context/ToastContext";
import { browserTimeZone } from "@/shared/domain/TimeZone";
import {
  choiceOf,
  countryName,
  describeChoice,
  searchTimeZones,
} from "@/shared/domain/TimeZoneSearch";
import { useTimeZone } from "@/shared/hooks/useTimeZone";

interface TimeZoneSettingProps {
  /** The country of the profile: its zones come first. */
  countryCode?: string | null;
  now?: () => Date;
}

// Enough for the zones of any country; more words narrow the search
const SHOWN = 40;

const describeZone = (zone: string, now: Date) => {
  const choice = choiceOf(zone);
  return choice ? describeChoice(choice, now) : zone;
};

/**
 * The time zone the interface shows times in, beside UTC (EV-115 lot C),
 * found by country, city or name. Unset, it is the browser's; the country
 * and the language of the site are other settings.
 */
const currentDate = () => new Date();

export const TimeZoneSetting: FC<TimeZoneSettingProps> = ({
  countryCode,
  now = currentDate,
}) => {
  const searchId = useId();
  const { chosen, setChosen } = useTimeZone();
  const browser = browserTimeZone();
  const [editing, setEditing] = useState(false);
  // null: the time zone of the browser
  const [draft, setDraft] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { pushToast } = useToast();
  const results = useMemo(
    () => searchTimeZones(query, countryCode),
    [query, countryCode],
  );
  const at = now();

  const startEditing = () => {
    setDraft(chosen);
    setQuery("");
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    const response = await updateMyTimeZone(draft);
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
        {chosen ? describeZone(chosen, at) : `Browser time (${browser})`}
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
      <Form.Label htmlFor={searchId} className="fw-bold mb-0">
        Time zone
      </Form.Label>
      <Form.Control
        id={searchId}
        type="search"
        value={query}
        placeholder="Search a country, a city or a time zone"
        onChange={(e) => setQuery(e.target.value)}
        disabled={busy}
      />
      <Form.Text>
        Selected:{" "}
        {draft ? describeZone(draft, at) : `browser time (${browser})`}. Times
        stay in UTC; this zone is shown beside them.
      </Form.Text>
      <ListGroup
        aria-label="Search results"
        className="overflow-auto"
        style={{ maxHeight: "20rem" }}
      >
        <ListGroup.Item
          action
          as="button"
          type="button"
          active={draft === null}
          aria-pressed={draft === null}
          onClick={() => setDraft(null)}
          disabled={busy}
        >
          Browser time ({browser})
        </ListGroup.Item>
        {results.slice(0, SHOWN).map((choice) => (
          <ListGroup.Item
            key={choice.zone}
            action
            as="button"
            type="button"
            active={draft === choice.zone}
            aria-pressed={draft === choice.zone}
            onClick={() => setDraft(choice.zone)}
            disabled={busy}
          >
            {describeChoice(choice, at)}
          </ListGroup.Item>
        ))}
      </ListGroup>
      {results.length > SHOWN && (
        <Form.Text>
          {SHOWN} of {results.length} time zones shown; type more words to
          narrow the search.
        </Form.Text>
      )}
      {query.trim() && results.length === 0 && (
        <Form.Text>No time zone matches “{query.trim()}”.</Form.Text>
      )}
      {!query.trim() && countryCode && results.length > 0 && (
        <Form.Text>
          The time zones of {countryName(countryCode)}; search for another
          country or city.
        </Form.Text>
      )}
      {error ? (
        <Alert variant="danger" className="mb-0 py-2">
          {error}
        </Alert>
      ) : null}
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
