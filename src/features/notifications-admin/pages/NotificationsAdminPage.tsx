import { withPageVisit } from "@variamosple/variamos-components";
import { type FC, useCallback, useEffect, useState } from "react";
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
import { queryRoles } from "@/features/role-management/api/RoleRepository";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { RolesFilter } from "@/features/role-management/domain/Entity/RolesFilter";
import type { User } from "@/features/user-management/domain/Entity/User";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import {
  countNotificationRecipients,
  type DispatchNotificationRequest,
  dispatchNotification,
} from "../api/NotificationsAdminRepository";
import { UserRecipientPicker } from "../components/UserRecipientPicker";

const ROLE_PAGE_SIZE = 100;

const accounts = (count: number) => `${count} account${count === 1 ? "" : "s"}`;

const NotificationsAdminPageComponent: FC = () => {
  usePageTitle("Notifications");
  const [audience, setAudience] = useState<"broadcast" | "role" | "users">(
    "broadcast",
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesTotal, setRolesTotal] = useState(0);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);
  // The dispatch waiting for its confirmation, with the number it reaches
  const [pending, setPending] = useState<{
    request: DispatchNotificationRequest;
    count: number;
  } | null>(null);

  // Users are searched on the server by the picker (UX-03); roles are
  // few, they are loaded once
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

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleRoleToggle = (roleName: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!title.trim() || !body.trim()) {
      setFeedback({
        type: "danger",
        message: "Please provide both title and message body.",
      });
      return;
    }

    if (audience === "role" && selectedRoles.length === 0) {
      setFeedback({
        type: "danger",
        message: "Please select at least one role.",
      });
      return;
    }

    if (audience === "users" && selectedUsers.length === 0) {
      setFeedback({
        type: "danger",
        message: "Please select at least one user.",
      });
      return;
    }

    const request: DispatchNotificationRequest = {
      audience,
      title,
      body,
      roles: audience === "role" ? selectedRoles : undefined,
      userIds:
        audience === "users"
          ? selectedUsers.map((user) => user.id as string)
          : undefined,
    };
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
      return;
    }
    if (counted.data.count === 0) {
      setFeedback({
        type: "danger",
        message: "No active account matches this audience.",
      });
      return;
    }
    setPending({ request, count: counted.data.count });
  };

  const send = async (request: DispatchNotificationRequest) => {
    setPending(null);
    setSubmitting(true);
    try {
      const response = await dispatchNotification(request);

      // Success has no error code; older servers answered errorCode 0
      if (!response.errorCode) {
        setFeedback({
          type: "success",
          message: "Notifications dispatched successfully!",
        });
        // Reset form inputs
        setTitle("");
        setBody("");
        setSelectedRoles([]);
        setSelectedUsers([]);
      } else {
        setFeedback({
          type: "danger",
          message: response.message || "Failed to dispatch notifications.",
        });
      }
    } catch (error) {
      const err = error as Error;
      setFeedback({
        type: "danger",
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  };

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

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    Audience Selection
                  </Form.Label>
                  <div className="d-flex gap-3 flex-wrap">
                    <Form.Check
                      type="radio"
                      id="audience-broadcast"
                      label={
                        <span className="d-flex align-items-center gap-1">
                          <Megaphone size={16} /> Broadcast (All Users)
                        </span>
                      }
                      name="audience"
                      checked={audience === "broadcast"}
                      onChange={() => setAudience("broadcast")}
                      className="border rounded p-2 px-3 bg-light"
                    />
                    <Form.Check
                      type="radio"
                      id="audience-role"
                      label={
                        <span className="d-flex align-items-center gap-1">
                          <People size={16} /> By Role
                        </span>
                      }
                      name="audience"
                      checked={audience === "role"}
                      onChange={() => setAudience("role")}
                      className="border rounded p-2 px-3 bg-light"
                    />
                    <Form.Check
                      type="radio"
                      id="audience-users"
                      label={
                        <span className="d-flex align-items-center gap-1">
                          <Person size={16} /> Specific Users
                        </span>
                      }
                      name="audience"
                      checked={audience === "users"}
                      onChange={() => setAudience("users")}
                      className="border rounded p-2 px-3 bg-light"
                    />
                  </div>
                </Form.Group>

                {/* Target Audience Selectors */}
                {audience === "role" && (
                  <Card className="mb-4 bg-light border-light">
                    <Card.Body>
                      <h6 className="fw-bold mb-2">Select Roles</h6>
                      {loadingRoles && (
                        <div className="text-muted d-flex align-items-center gap-2">
                          <Spinner animation="border" size="sm" /> Loading
                          roles...
                        </div>
                      )}
                      {rolesError && (
                        <Alert
                          variant="danger"
                          className="py-2 d-flex align-items-center gap-2"
                        >
                          <span>{rolesError}</span>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="ms-auto"
                            onClick={loadRoles}
                          >
                            Retry
                          </Button>
                        </Alert>
                      )}
                      {rolesTotal > roles.length && (
                        <p className="small text-muted">
                          Only the first {roles.length} of {rolesTotal} roles
                          are listed.
                        </p>
                      )}
                      <Row xs={1} sm={2} className="g-2">
                        {roles.map((role) => (
                          <Col key={role.id}>
                            <Form.Check
                              type="checkbox"
                              id={`role-${role.id}`}
                              label={role.name}
                              checked={selectedRoles.includes(role.name)}
                              onChange={() => handleRoleToggle(role.name)}
                            />
                          </Col>
                        ))}
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {audience === "users" && (
                  <Card className="mb-4 bg-light border-light">
                    <Card.Body>
                      <h6 className="fw-bold mb-2">Select Target Users</h6>
                      <UserRecipientPicker
                        selected={selectedUsers}
                        onAdd={addUser}
                        onRemove={removeUser}
                      />
                    </Card.Body>
                  </Card>
                )}

                <Form.Group className="mb-3" controlId="notification-title">
                  <Form.Label className="fw-semibold">
                    Notification Title
                  </Form.Label>
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

                {/* Next to the button, where the eye is after a click (UX-21) */}
                {feedback && (
                  <Alert
                    variant={feedback.type}
                    dismissible
                    onClose={() => setFeedback(null)}
                  >
                    {feedback.message}
                  </Alert>
                )}

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
        onConfirm={() => pending && send(pending.request)}
        onCancel={() => setPending(null)}
      />
    </Container>
  );
};

export const NotificationsAdminPage = withPageVisit(
  NotificationsAdminPageComponent,
  "notifications-admin-dashboard",
);
