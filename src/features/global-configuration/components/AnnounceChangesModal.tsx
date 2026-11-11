import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import {
  countNotificationRecipients,
  type DispatchNotificationRequest,
  dispatchNotification,
} from "@/features/notifications-admin/api/NotificationsAdminRepository";
import { queryRoles } from "@/features/role-management/api/RoleRepository";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { RolesFilter } from "@/features/role-management/domain/Entity/RolesFilter";
import { RoleCheckboxList } from "@/shared/components/RoleCheckboxList";
import type { ChangeAnnouncement } from "../domain/Entity/ChangeAnnouncement";

const ROLE_PAGE_SIZE = 100;

const accounts = (count: number) => `${count} account${count === 1 ? "" : "s"}`;

export interface AnnounceChangesModalProps {
  /** What the saved settings suggest; the dialog is shown while set. */
  announcement: ChangeAnnouncement | null;
  onClose: () => void;
}

/**
 * Offers to tell users about the settings just saved (EV-115 lot A). The
 * text is suggested and editable; nothing is sent without "Send", then the
 * confirmation of the number of accounts reached.
 */
export const AnnounceChangesModal: FC<AnnounceChangesModalProps> = ({
  announcement,
  onClose,
}) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"broadcast" | "role">("broadcast");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesTotal, setRolesTotal] = useState(0);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    request: DispatchNotificationRequest;
    count: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The same message sent again after an error keeps its key, so that it
  // reaches each account once (EV-99); a changed message gets a new one
  const sentKey = useRef<{ content: string; key: string } | null>(null);

  useEffect(() => {
    if (!announcement) return;
    setTitle(announcement.title);
    setBody(announcement.body);
    setAudience("broadcast");
    setSelectedRoles([]);
    setPending(null);
    setError(null);
    sentKey.current = null;
  }, [announcement]);

  const loadRoles = useCallback(async () => {
    setLoadingRoles(true);
    setRolesError(null);
    const response = await queryRoles(
      new RolesFilter(undefined, 1, ROLE_PAGE_SIZE),
    );
    if (response.errorCode) {
      setRolesError(response.message || "The roles could not be loaded.");
    } else {
      setRoles(response.data ?? []);
      setRolesTotal(response.totalCount ?? response.data?.length ?? 0);
    }
    setLoadingRoles(false);
  }, []);

  // Loaded when first needed: most announcements go to the whole site
  useEffect(() => {
    if (audience === "role" && roles.length === 0 && !loadingRoles) {
      loadRoles();
    }
  }, [audience, roles.length, loadingRoles, loadRoles]);

  const toggleRole = (name: string) =>
    setSelectedRoles((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name],
    );

  const review = async () => {
    if (!announcement) return;
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError("Please provide both a title and a message.");
      return;
    }
    if (audience === "role" && selectedRoles.length === 0) {
      setError("Please select at least one role.");
      return;
    }
    const request: DispatchNotificationRequest = {
      audience,
      roles: audience === "role" ? selectedRoles : undefined,
      title,
      body,
      announces: announcement.keys,
    };
    setBusy(true);
    const counted = await countNotificationRecipients(request);
    setBusy(false);
    if (counted.errorCode || !counted.data) {
      setError(counted.message || "Failed to count the recipients.");
      return;
    }
    if (counted.data.count === 0) {
      setError("No active account matches this audience.");
      return;
    }
    setPending({ request, count: counted.data.count });
  };

  const keyOf = (request: DispatchNotificationRequest) => {
    const content = JSON.stringify(request);
    if (sentKey.current?.content !== content) {
      sentKey.current = { content, key: crypto.randomUUID() };
    }
    return sentKey.current.key;
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

  return (
    <Modal
      show={announcement !== null}
      onHide={busy ? undefined : onClose}
      aria-labelledby="announce-changes-title"
      centered
    >
      <Modal.Header closeButton={!busy}>
        <Modal.Title id="announce-changes-title" as="h2" className="fs-5">
          Announce this change?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {pending ? (
          <p className="mb-0">
            Send "{pending.request.title}" to {accounts(pending.count)}? A sent
            notification cannot be recalled.
          </p>
        ) : (
          <>
            <p className="text-muted small">
              Users are not told about this change unless you send this
              notification.
            </p>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold mb-1">Audience</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="announce-audience-broadcast"
                  name="announce-audience"
                  label="Whole site"
                  checked={audience === "broadcast"}
                  onChange={() => setAudience("broadcast")}
                />
                <Form.Check
                  type="radio"
                  id="announce-audience-role"
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
                  roles={roles}
                  total={rolesTotal}
                  loading={loadingRoles}
                  error={rolesError}
                  onRetry={loadRoles}
                  selected={selectedRoles}
                  onToggle={toggleRole}
                />
              </div>
            )}
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
        )}
        {error && (
          <Alert variant="danger" className="mt-3 mb-0 py-2">
            {error}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        {pending ? (
          <>
            <Button
              variant="outline-secondary"
              onClick={() => setPending(null)}
              disabled={busy}
            >
              Back
            </Button>
            <Button variant="primary" onClick={send} disabled={busy}>
              {busy ? (
                <Spinner size="sm" animation="border" />
              ) : (
                `Send to ${accounts(pending.count)}`
              )}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline-secondary"
              onClick={onClose}
              disabled={busy}
            >
              Don't announce
            </Button>
            <Button variant="primary" onClick={review} disabled={busy}>
              {busy ? <Spinner size="sm" animation="border" /> : "Send"}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};
