import {
  type FC,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import {
  countNotificationRecipients,
  type DispatchNotificationRequest,
  dispatchNotification,
} from "@/features/notifications-admin/api/NotificationsAdminRepository";
import { queryRoleChoices } from "@/features/role-management/api/RoleRepository";
import { RoleCheckboxList } from "@/shared/components/RoleCheckboxList";
import { useLoadedList } from "@/shared/hooks/useLoadedList";

const accounts = (count: number) => `${count} account${count === 1 ? "" : "s"}`;

/** The right to send an announcement, checked again by the server. */
export const NOTIFICATION_DISPATCH_PERMISSION =
  "admin::notifications::dispatch";

/** A suggested announcement, editable before it is sent. */
export interface AnnouncementDraft {
  title: string;
  body: string;
  /** The settings it announces, recorded with it (EV-115 lot A). */
  keys?: string[];
}

export interface AnnouncementModalProps {
  /** The suggested text; the dialog is shown while set. */
  announcement: AnnouncementDraft | null;
  /** The dialog title. */
  heading?: string;
  onClose: () => void;
}

type Audience = "broadcast" | "role";

// The roles an announcement may go to, loaded when first needed: most
// announcements go to the whole site
const useAnnouncementRoles = (audience: Audience) => {
  const {
    items: roles,
    total,
    loading,
    error,
    load,
  } = useLoadedList(queryRoleChoices, "The roles could not be loaded.");

  useEffect(() => {
    if (audience === "role" && roles.length === 0 && !loading) {
      void load();
    }
  }, [audience, roles.length, loading, load]);

  return { roles, total, loading, error, load };
};

// The same message sent again after an error keeps its key, so that it
// reaches each account once (EV-99); a changed message gets a new one
const useSendKey = () => {
  const sentKeyRef = useRef<{ content: string; key: string } | null>(null);
  const keyOf = (request: DispatchNotificationRequest) => {
    const content = JSON.stringify(request);
    if (sentKeyRef.current?.content !== content) {
      sentKeyRef.current = { content, key: crypto.randomUUID() };
    }
    return sentKeyRef.current.key;
  };
  const reset = useCallback(() => {
    sentKeyRef.current = null;
  }, []);
  return { keyOf, reset };
};

interface AnnouncementInput {
  title: string;
  body: string;
  audience: Audience;
  selectedRoles: string[];
}

const invalidAnnouncement = (input: AnnouncementInput): string | null => {
  if (!input.title.trim() || !input.body.trim()) {
    return "Please provide both a title and a message.";
  }
  if (input.audience === "role" && input.selectedRoles.length === 0) {
    return "Please select at least one role.";
  }
  return null;
};

interface PendingAnnouncement {
  request: DispatchNotificationRequest;
  count: number;
}

// The announcement being written, reviewed (number of accounts) and sent
const useAnnouncementDraft = (props: AnnouncementModalProps) => {
  const { announcement, onClose } = props;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("broadcast");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingAnnouncement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { keyOf, reset: resetSendKey } = useSendKey();

  useEffect(() => {
    if (!announcement) return;
    setTitle(announcement.title);
    setBody(announcement.body);
    setAudience("broadcast");
    setSelectedRoles([]);
    setPending(null);
    setError(null);
    resetSendKey();
  }, [announcement, resetSendKey]);

  const toggleRole = (name: string) =>
    setSelectedRoles((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name],
    );

  const review = async () => {
    if (!announcement) return;
    const invalid = invalidAnnouncement({
      title,
      body,
      audience,
      selectedRoles,
    });
    setError(invalid);
    if (invalid) return;
    const request: DispatchNotificationRequest = {
      audience,
      roles: audience === "role" ? selectedRoles : undefined,
      title,
      body,
      announces: announcement.keys?.length ? announcement.keys : undefined,
    };
    setBusy(true);
    const counted = await countNotificationRecipients(request);
    setBusy(false);
    if (counted.errorCode || !counted.data) {
      setError(counted.message || "Failed to count the recipients.");
    } else if (counted.data.count === 0) {
      setError("No active account matches this audience.");
    } else {
      setPending({ request, count: counted.data.count });
    }
  };

  const send = async () => {
    if (!pending) return;
    setBusy(true);
    const response = await dispatchNotification({
      ...pending.request,
      eventId: keyOf(pending.request),
    });
    setBusy(false);
    if (response.errorCode) {
      setPending(null);
      setError(response.message || "Failed to send the announcement.");
      return;
    }
    onClose();
  };

  return {
    fields: { title, setTitle, body, setBody, audience, setAudience },
    selectedRoles,
    toggleRole,
    pending,
    setPending,
    busy,
    error,
    review,
    send,
  };
};

type Draft = ReturnType<typeof useAnnouncementDraft>;
type AnnouncementRoles = ReturnType<typeof useAnnouncementRoles>;

interface DraftProps {
  draft: Draft;
  roles: AnnouncementRoles;
}

const AudienceChoice: FC<DraftProps> = ({ draft, roles }) => {
  const broadcastId = useId();
  const roleAudienceId = useId();
  const { audience, setAudience } = draft.fields;
  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold mb-1">Audience</Form.Label>
        <div className="d-flex gap-3">
          <Form.Check
            type="radio"
            id={broadcastId}
            name="announce-audience"
            label="Whole site"
            checked={audience === "broadcast"}
            onChange={() => setAudience("broadcast")}
          />
          <Form.Check
            type="radio"
            id={roleAudienceId}
            name="announce-audience"
            label="Some roles"
            checked={audience === "role"}
            onChange={() => setAudience("role")}
          />
        </div>
      </Form.Group>
      {audience === "role" && (
        <div className="mb-3">
          <RoleCheckboxList
            idPrefix="announce-role"
            roles={roles.roles}
            total={roles.total}
            loading={roles.loading}
            error={roles.error}
            onRetry={roles.load}
            selected={draft.selectedRoles}
            onToggle={draft.toggleRole}
          />
        </div>
      )}
    </>
  );
};

const AnnouncementForm: FC<DraftProps> = ({ draft, roles }) => {
  const { title, setTitle, body, setBody } = draft.fields;
  return (
    <>
      <p className="text-muted small">
        Users are not told about this change unless you send this notification.
      </p>
      <AudienceChoice draft={draft} roles={roles} />
      <Form.Group className="mb-3" controlId="announce-title">
        <Form.Label className="fw-semibold mb-1">Title</Form.Label>
        <Form.Control
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Form.Group>
      <Form.Group controlId="announce-body">
        <Form.Label className="fw-semibold mb-1">Message</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </Form.Group>
    </>
  );
};

const AnnouncementButtons: FC<{ draft: Draft; onClose: () => void }> = ({
  draft,
  onClose,
}) => {
  const { pending, busy } = draft;
  if (pending) {
    return (
      <>
        <Button
          variant="outline-secondary"
          onClick={() => draft.setPending(null)}
          disabled={busy}
        >
          Back
        </Button>
        <Button variant="primary" onClick={draft.send} disabled={busy}>
          {busy ? (
            <Spinner size="sm" animation="border" />
          ) : (
            `Send to ${accounts(pending.count)}`
          )}
        </Button>
      </>
    );
  }
  return (
    <>
      <Button variant="outline-secondary" onClick={onClose} disabled={busy}>
        Don't announce
      </Button>
      <Button variant="primary" onClick={draft.review} disabled={busy}>
        {busy ? <Spinner size="sm" animation="border" /> : "Send"}
      </Button>
    </>
  );
};

/**
 * Offers to tell users about a change: settings just saved (EV-115 lot A)
 * or a service about to restart (EV-86). The text is suggested and
 * editable; nothing is sent without "Send", then the confirmation of the
 * number of accounts reached.
 */
export const AnnouncementModal: FC<AnnouncementModalProps> = (props) => {
  const { announcement, onClose } = props;
  const titleId = useId();
  const draft = useAnnouncementDraft(props);
  // Kept by the dialog: loaded once for all its openings
  const roles = useAnnouncementRoles(draft.fields.audience);
  const { pending, busy, error } = draft;

  return (
    <Modal
      show={announcement !== null}
      onHide={busy ? undefined : onClose}
      aria-labelledby={titleId}
      centered
    >
      <Modal.Header closeButton={!busy}>
        <Modal.Title id={titleId} as="h2" className="fs-5">
          {props.heading ?? "Announce this change?"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {pending ? (
          <p className="mb-0">
            Send "{pending.request.title}" to {accounts(pending.count)}? A sent
            notification cannot be recalled.
          </p>
        ) : (
          <AnnouncementForm draft={draft} roles={roles} />
        )}
        {error ? (
          <Alert variant="danger" className="mt-3 mb-0 py-2">
            {error}
          </Alert>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <AnnouncementButtons draft={draft} onClose={onClose} />
      </Modal.Footer>
    </Modal>
  );
};
