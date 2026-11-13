import { withPageVisit } from "@variamosple/variamos-components";
import {
  type FC,
  type ReactNode,
  type SubmitEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { Megaphone, People, Person, Send } from "react-bootstrap-icons";
import { queryRoleChoices } from "@/features/role-management/api/RoleRepository";
import type { User } from "@/features/user-management/domain/Entity/User";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { RoleCheckboxList } from "@/shared/components/RoleCheckboxList";
import { useLoadedList } from "@/shared/hooks/useLoadedList";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import {
  countNotificationRecipients,
  type DispatchNotificationRequest,
  dispatchNotification,
} from "../api/NotificationsAdminRepository";
import { UserRecipientPicker } from "../components/UserRecipientPicker";

const accounts = (count: number) => `${count} account${count === 1 ? "" : "s"}`;

type Audience = "broadcast" | "role" | "users";

type Feedback = { type: "success" | "danger"; message: string };

// Users are searched on the server by the picker (UX-03); roles are few,
// they are loaded once
const useRoleOptions = () => {
  const {
    items: roles,
    total,
    loading,
    error,
    load,
  } = useLoadedList(queryRoleChoices, "The roles could not be loaded.");

  useEffect(() => {
    void load();
  }, [load]);

  return { roles, total, loading, error, load };
};

// The notification being written: its audience, recipients and text
const useNotificationDraft = () => {
  const [audience, setAudience] = useState<Audience>("broadcast");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName],
    );
  };
  const addUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((selected) => selected.id === user.id) ? prev : [...prev, user],
    );
  };
  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
  };
  // The form is emptied once the notification is sent
  const clear = () => {
    setTitle("");
    setBody("");
    setSelectedRoles([]);
    setSelectedUsers([]);
  };

  return {
    audience,
    setAudience,
    text: { title, setTitle, body, setBody },
    selectedRoles,
    toggleRole,
    selectedUsers,
    addUser,
    removeUser,
    clear,
  };
};

type Draft = ReturnType<typeof useNotificationDraft>;

const invalidDraft = (draft: Draft): string | null => {
  if (!draft.text.title.trim() || !draft.text.body.trim()) {
    return "Please provide both title and message body.";
  }
  if (draft.audience === "role" && draft.selectedRoles.length === 0) {
    return "Please select at least one role.";
  }
  if (draft.audience === "users" && draft.selectedUsers.length === 0) {
    return "Please select at least one user.";
  }
  return null;
};

const requestOf = (draft: Draft): DispatchNotificationRequest => ({
  audience: draft.audience,
  title: draft.text.title,
  body: draft.text.body,
  roles: draft.audience === "role" ? draft.selectedRoles : undefined,
  userIds:
    draft.audience === "users"
      ? draft.selectedUsers.flatMap((user) => (user.id ? [user.id] : []))
      : undefined,
});

// Counting the recipients, then sending once confirmed
const useDispatch = (draft: Draft) => {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // The dispatch waiting for its confirmation, with the number it reaches
  const [pending, setPending] = useState<{
    request: DispatchNotificationRequest;
    count: number;
  } | null>(null);
  // The key of the last message whose dispatch failed (EV-99). Sent again
  // unchanged, the message keeps it: the accounts it already reached get
  // nothing twice. A changed message is a new one, with a new key.
  const failedDispatchRef = useRef<{ content: string; key: string } | null>(
    null,
  );

  const review = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const invalid = invalidDraft(draft);
    setFeedback(invalid ? { type: "danger", message: invalid } : null);
    if (invalid) return;
    const request = requestOf(draft);
    // Nothing is sent before the confirmation shows how many accounts
    // the notification reaches (UX-02)
    setSubmitting(true);
    const counted = await countNotificationRecipients(request);
    setSubmitting(false);
    if (counted.errorCode || !counted.data) {
      setFeedback({
        type: "danger",
        message: counted.message || "Failed to count the recipients.",
      });
    } else if (counted.data.count === 0) {
      setFeedback({
        type: "danger",
        message: "No active account matches this audience.",
      });
    } else {
      setPending({ request, count: counted.data.count });
    }
  };

  const keyOf = (request: DispatchNotificationRequest) => {
    const content = JSON.stringify(request);
    if (failedDispatchRef.current?.content !== content) {
      failedDispatchRef.current = { content, key: crypto.randomUUID() };
    }
    return failedDispatchRef.current.key;
  };

  const send = async (request: DispatchNotificationRequest) => {
    setPending(null);
    setSubmitting(true);
    try {
      const response = await dispatchNotification({
        ...request,
        eventId: keyOf(request),
      });
      // Success has no error code; older servers answered errorCode 0
      if (response.errorCode) {
        setFeedback({
          type: "danger",
          message: response.message || "Failed to dispatch notifications.",
        });
      } else {
        failedDispatchRef.current = null;
        setFeedback({
          type: "success",
          message: "Notifications dispatched successfully!",
        });
        draft.clear();
      }
    } catch (error) {
      setFeedback({
        type: "danger",
        message:
          error instanceof Error && error.message !== ""
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    feedback,
    setFeedback,
    pending,
    setPending,
    review,
    send,
  };
};

const AUDIENCE_CHOICES: { value: Audience; icon: ReactNode; label: string }[] =
  [
    {
      value: "broadcast",
      icon: <Megaphone size={16} />,
      label: "Broadcast (All Users)",
    },
    { value: "role", icon: <People size={16} />, label: "By Role" },
    { value: "users", icon: <Person size={16} />, label: "Specific Users" },
  ];

const AudienceChoice: FC<{ draft: Draft }> = ({ draft }) => {
  const audienceId = useId();
  return (
    <Form.Group className="mb-4">
      <Form.Label className="fw-semibold">Audience Selection</Form.Label>
      <div className="d-flex gap-3 flex-wrap">
        {AUDIENCE_CHOICES.map(({ value, icon, label }) => (
          <Form.Check
            key={value}
            type="radio"
            id={`${audienceId}-${value}`}
            label={
              <span className="d-flex align-items-center gap-1">
                {icon} {label}
              </span>
            }
            name="audience"
            checked={draft.audience === value}
            onChange={() => draft.setAudience(value)}
            className="border rounded p-2 px-3 bg-light"
          />
        ))}
      </div>
    </Form.Group>
  );
};

const AudienceTargets: FC<{
  draft: Draft;
  roles: ReturnType<typeof useRoleOptions>;
}> = ({ draft, roles }) => (
  <>
    {draft.audience === "role" && (
      <Card className="mb-4 bg-light border-light">
        <Card.Body>
          <h6 className="fw-bold mb-2">Select Roles</h6>
          <RoleCheckboxList
            roles={roles.roles}
            total={roles.total}
            loading={roles.loading}
            error={roles.error}
            onRetry={roles.load}
            selected={draft.selectedRoles}
            onToggle={draft.toggleRole}
          />
        </Card.Body>
      </Card>
    )}

    {draft.audience === "users" && (
      <Card className="mb-4 bg-light border-light">
        <Card.Body>
          <h6 className="fw-bold mb-2">Select Target Users</h6>
          <UserRecipientPicker
            selected={draft.selectedUsers}
            onAdd={draft.addUser}
            onRemove={draft.removeUser}
          />
        </Card.Body>
      </Card>
    )}
  </>
);

const MessageFields: FC<{ draft: Draft }> = ({ draft }) => {
  const { title, setTitle, body, setBody } = draft.text;
  return (
    <>
      <Form.Group className="mb-3" controlId="notification-title">
        <Form.Label className="fw-semibold">Notification Title</Form.Label>
        <Form.Control
          type="text"
          placeholder="e.g., Scheduled Maintenance Alert"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-4" controlId="notification-body">
        <Form.Label className="fw-semibold">Message Body</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          placeholder="Enter the notification message here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      </Form.Group>
    </>
  );
};

const SubmitButton: FC<{ submitting: boolean }> = ({ submitting }) => (
  <div className="d-grid justify-content-end">
    <Button
      type="submit"
      variant="primary"
      disabled={submitting}
      className="px-4 py-2 fw-semibold d-flex align-items-center gap-2"
    >
      {submitting ? (
        <>
          <Spinner size="sm" animation="border" /> Sending...
        </>
      ) : (
        <>
          <Send size={16} /> Dispatch Notification
        </>
      )}
    </Button>
  </div>
);

const NotificationsAdminPageComponent: FC = () => {
  usePageTitle("Notifications");
  const draft = useNotificationDraft();
  const roles = useRoleOptions();
  const dispatch = useDispatch(draft);
  const { feedback, pending } = dispatch;

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm border-0 rounded-3">
            <Card.Header className="bg-primary text-white py-3 d-flex align-items-center">
              <Megaphone className="me-2" size={24} />
              <h4 className="mb-0 fw-bold">Manual Notifications Dashboard</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <p className="text-muted">
                Create and target real-time notifications to users in the
                VariaMos platform.
              </p>

              <Form onSubmit={dispatch.review} noValidate>
                <AudienceChoice draft={draft} />

                {/* Target Audience Selectors */}
                <AudienceTargets draft={draft} roles={roles} />

                <MessageFields draft={draft} />

                {/* Next to the button, where the eye is after a click (UX-21) */}
                {feedback ? (
                  <Alert
                    variant={feedback.type}
                    dismissible
                    onClose={() => dispatch.setFeedback(null)}
                  >
                    {feedback.message}
                  </Alert>
                ) : null}

                <SubmitButton submitting={dispatch.submitting} />
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <ConfirmationModal
        show={pending !== null}
        title="Send notification"
        message={
          pending
            ? `Send "${pending.request.title}" to ${accounts(pending.count)}? A sent notification cannot be recalled.`
            : ""
        }
        confirmLabel={pending ? `Send to ${accounts(pending.count)}` : "Send"}
        onConfirm={() => pending && dispatch.send(pending.request)}
        onCancel={() => dispatch.setPending(null)}
      />
    </Container>
  );
};

export const NotificationsAdminPage = withPageVisit(
  NotificationsAdminPageComponent,
  "notifications-admin-dashboard",
);
