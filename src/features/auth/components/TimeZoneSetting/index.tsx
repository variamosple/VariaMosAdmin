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

const currentDate = () => new Date();

// The zone being chosen, and its saving
const useTimeZoneDraft = () => {
  const { chosen, setChosen } = useTimeZone();
  const [editing, setEditing] = useState(false);
  // null: the time zone of the browser
  const [draft, setDraft] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { pushToast } = useToast();

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

  return {
    chosen,
    editing,
    setEditing,
    draft,
    setDraft,
    query,
    setQuery,
    busy,
    error,
    startEditing,
    save,
  };
};

type Draft = ReturnType<typeof useTimeZoneDraft>;

interface ZoneListProps {
  draft: Draft;
  results: ReturnType<typeof searchTimeZones>;
  browser: string;
  at: Date;
}

const ZoneList: FC<ZoneListProps> = ({ draft, results, browser, at }) => (
  <ListGroup
    aria-label="Search results"
    className="overflow-auto"
    style={{ maxHeight: "20rem" }}
  >
    <ListGroup.Item
      action
      as="button"
      type="button"
      active={draft.draft === null}
      aria-pressed={draft.draft === null}
      onClick={() => draft.setDraft(null)}
      disabled={draft.busy}
    >
      Browser time ({browser})
    </ListGroup.Item>
    {results.slice(0, SHOWN).map((choice) => (
      <ListGroup.Item
        key={choice.zone}
        action
        as="button"
        type="button"
        active={draft.draft === choice.zone}
        aria-pressed={draft.draft === choice.zone}
        onClick={() => draft.setDraft(choice.zone)}
        disabled={draft.busy}
      >
        {describeChoice(choice, at)}
      </ListGroup.Item>
    ))}
  </ListGroup>
);

interface SearchHintsProps {
  query: string;
  results: ReturnType<typeof searchTimeZones>;
  countryCode?: string | null;
}

const SearchHints: FC<SearchHintsProps> = ({ query, results, countryCode }) => (
  <>
    {results.length > SHOWN && (
      <Form.Text>
        {SHOWN} of {results.length} time zones shown; type more words to narrow
        the search.
      </Form.Text>
    )}
    {query.trim() && results.length === 0 && (
      <Form.Text>No time zone matches “{query.trim()}”.</Form.Text>
    )}
    {!query.trim() && countryCode && results.length > 0 && (
      <Form.Text>
        The time zones of {countryName(countryCode)}; search for another country
        or city.
      </Form.Text>
    )}
  </>
);

const DraftButtons: FC<{ draft: Draft }> = ({ draft }) => (
  <div className="d-flex gap-2">
    <Button size="sm" onClick={draft.save} disabled={draft.busy}>
      {draft.busy ? <Spinner size="sm" animation="border" /> : "Save"}
    </Button>
    <Button
      size="sm"
      variant="outline-secondary"
      onClick={() => draft.setEditing(false)}
      disabled={draft.busy}
    >
      Cancel
    </Button>
  </div>
);

/**
 * The time zone the interface shows times in, beside UTC (EV-115 lot C),
 * found by country, city or name. Unset, it is the browser's; the country
 * and the language of the site are other settings.
 */
export const TimeZoneSetting: FC<TimeZoneSettingProps> = ({
  countryCode,
  now = currentDate,
}) => {
  const searchId = useId();
  const browser = browserTimeZone();
  const draft = useTimeZoneDraft();
  const { query, chosen } = draft;
  const results = useMemo(
    () => searchTimeZones(query, countryCode),
    [query, countryCode],
  );
  const at = now();

  if (!draft.editing) {
    return (
      <>
        <span className="fw-bold">Time zone: </span>
        {chosen ? describeZone(chosen, at) : `Browser time (${browser})`}
        <Button
          className="ms-1"
          variant="primary"
          size="sm"
          onClick={draft.startEditing}
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
        onChange={(e) => draft.setQuery(e.target.value)}
        disabled={draft.busy}
      />
      <Form.Text>
        Selected:{" "}
        {draft.draft
          ? describeZone(draft.draft, at)
          : `browser time (${browser})`}
        . Times stay in UTC; this zone is shown beside them.
      </Form.Text>
      <ZoneList draft={draft} results={results} browser={browser} at={at} />
      <SearchHints query={query} results={results} countryCode={countryCode} />
      {draft.error ? (
        <Alert variant="danger" className="mb-0 py-2">
          {draft.error}
        </Alert>
      ) : null}
      <DraftButtons draft={draft} />
    </div>
  );
};
