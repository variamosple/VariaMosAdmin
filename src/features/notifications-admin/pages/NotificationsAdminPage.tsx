import { withPageVisit } from "@variamosple/variamos-components";
import { type FC, useEffect, useState } from "react";
import {
  Alert,
  Badge,
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
import { queryUsers } from "@/features/user-management/api/UserRepository";
import type { User } from "@/features/user-management/domain/Entity/User";
import { UsersFilter } from "@/features/user-management/domain/Entity/UsersFilter";
import { dispatchNotification } from "../api/NotificationsAdminRepository";

const NotificationsAdminPageComponent: FC = () => {
  const [audience, setAudience] = useState<"broadcast" | "role" | "users">(
    "broadcast",
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Loaded metadata
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const [usersRes, rolesRes] = await Promise.all([
          queryUsers(new UsersFilter(undefined, undefined, undefined, 1, 200)),
          queryRoles(new RolesFilter(undefined, 1, 100)),
        ]);

        if (usersRes.data) {
          // Filter out disabled/deleted users
          setUsers(usersRes.data.filter((u) => u.isEnabled && !u.isDeleted));
        }
        if (rolesRes.data) {
          setRoles(rolesRes.data);
        }
      } catch (error) {
        console.error(
          "Failed to load users or roles for notifications admin:",
          error,
        );
      } finally {
        setLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, []);

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName],
    );
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
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

    setSubmitting(true);
    try {
      const response = await dispatchNotification({
        audience,
        title,
        body,
        roles: audience === "role" ? selectedRoles : undefined,
        userIds: audience === "users" ? selectedUsers : undefined,
      });

      if (response.errorCode === 0) {
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

              {feedback && (
                <Alert
                  variant={feedback.type}
                  dismissible
                  onClose={() => setFeedback(null)}
                >
                  {feedback.message}
                </Alert>
              )}

              {loadingMetadata ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">
                    Loading target audience data...
                  </p>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
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
                        className="border rounded p-2 px-3 bg-light cursor-pointer"
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
                        className="border rounded p-2 px-3 bg-light cursor-pointer"
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
                        className="border rounded p-2 px-3 bg-light cursor-pointer"
                      />
                    </div>
                  </Form.Group>

                  {/* Target Audience Selectors */}
                  {audience === "role" && (
                    <Card className="mb-4 bg-light border-light">
                      <Card.Body>
                        <h6 className="fw-bold mb-2">Select Roles</h6>
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

                        {/* Selected User Badges */}
                        {selectedUsers.length > 0 && (
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {selectedUsers.map((userId) => {
                              const user = users.find((u) => u.id === userId);
                              return (
                                <Badge
                                  key={userId}
                                  bg="primary"
                                  className="d-flex align-items-center gap-2 p-2"
                                  style={{ borderRadius: "20px" }}
                                >
                                  <span>
                                    {user
                                      ? `${user.name} (${user.email})`
                                      : userId}
                                  </span>
                                  <Button
                                    variant="link"
                                    className="p-0 text-white border-0 d-flex align-items-center"
                                    onClick={() => handleUserToggle(userId)}
                                    style={{ lineHeight: 1, boxShadow: "none" }}
                                  >
                                    &times;
                                  </Button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}

                        {/* Search input with dynamic dropdown list */}
                        <div className="position-relative">
                          <Form.Control
                            type="text"
                            placeholder="Search user by name or email..."
                            value={userSearch}
                            onChange={(e) => {
                              setUserSearch(e.target.value);
                              setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                          />

                          {showDropdown && userSearch.trim().length > 0 && (
                            <div
                              className="position-absolute w-100 bg-white border rounded shadow-lg mt-1"
                              style={{
                                zIndex: 1000,
                                maxHeight: "200px",
                                overflowY: "auto",
                              }}
                            >
                              {users
                                .filter(
                                  (user) =>
                                    (user.name
                                      .toLowerCase()
                                      .includes(userSearch.toLowerCase()) ||
                                      user.email
                                        .toLowerCase()
                                        .includes(userSearch.toLowerCase())) &&
                                    !selectedUsers.includes(user.id as string),
                                )
                                .map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    className="p-2 border-bottom text-dark w-100 text-start bg-transparent border-0 d-block"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                      handleUserToggle(user.id as string);
                                      setUserSearch("");
                                      setShowDropdown(false);
                                    }}
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") {
                                        handleUserToggle(user.id as string);
                                        setUserSearch("");
                                        setShowDropdown(false);
                                      }
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "#f8f9fa")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "transparent")
                                    }
                                  >
                                    <strong>{user.name}</strong>{" "}
                                    <span className="text-muted">
                                      ({user.email})
                                    </span>
                                  </button>
                                ))}
                              {users.filter(
                                (user) =>
                                  (user.name
                                    .toLowerCase()
                                    .includes(userSearch.toLowerCase()) ||
                                    user.email
                                      .toLowerCase()
                                      .includes(userSearch.toLowerCase())) &&
                                  !selectedUsers.includes(user.id as string),
                              ).length === 0 && (
                                <div className="p-2 text-muted text-center">
                                  No matching users found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
                    <Form.Label className="fw-semibold">
                      Message Body
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Enter the notification message here..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required
                    />
                  </Form.Group>

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
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export const NotificationsAdminPage = withPageVisit(
  NotificationsAdminPageComponent,
  "notifications-admin-dashboard",
);
