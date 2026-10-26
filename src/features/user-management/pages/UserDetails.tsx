import { useRouter, withPageVisit } from "@variamosple/variamos-components";
import { type FC, useCallback, useEffect, useState } from "react";
import { Button, Container, Spinner } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { useParams } from "react-router-dom";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { queryUserById } from "@/features/user-management/api/UserRepository";
import {
  createUserRole,
  deleteUserRole,
  queryUserRoles,
} from "@/features/user-management/api/UserRoleRepository";
import { AccountMfaSection } from "@/features/user-management/components/AccountMfaSection";
import { UserDetails } from "@/features/user-management/components/UserDetails";
import type { User } from "@/features/user-management/domain/Entity/User";
import { UserRole } from "@/features/user-management/domain/Entity/UserRole";
import { UserRoleFilter } from "@/features/user-management/domain/Entity/UserRoleFilter";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import {
  LoadProblem,
  type LoadProblemKind,
  loadProblemOf,
} from "@/shared/components/LoadProblem";
import { useToast } from "@/shared/context/ToastContext";
import { usePagedList } from "@/shared/hooks/usePagedList";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { UserRoleForm } from "../components/UserRoleForm";
import { UserRoleList } from "../components/UserRoleList";

const UserDetailsPageComponent: FC = () => {
  const { pushToast, removeToast } = useToast();
  const { navigate } = useRouter();
  const { userId: userIdParam } = useParams();
  const [user, setUser] = useState<User>();
  usePageTitle(user ? `User ${user.name}` : "User");
  const [problem, setProblem] = useState<LoadProblemKind | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toDeleteRole, setToDeleteRole] = useState<Role>();

  const {
    data: userRoles,
    currentPage: currentUserRolePage,
    loadData: loadUserRoles,
    totalPages: userRoleTotalPages,
    filter: userRolesFilter,
    onPageChange: onUserRolesPageChange,
    listState: userRolesState,
  } = usePagedList<UserRoleFilter, Role>({
    queryFunction: queryUserRoles,
    initialFilter: new UserRoleFilter(),
  });

  const queryUser = useCallback((userId: string) => {
    setIsLoading(true);
    queryUserById(userId)
      .then((response) => {
        setProblem(loadProblemOf(response));
        setUser(response.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const onUserRoleCreate = (UserRole: UserRole) => {
    if (!userIdParam) {
      pushToast({
        title: "Role assignment",
        message: "User ID is missing",
        variant: "danger",
      });
      return;
    }

    setIsCreating(true);
    const toastId = pushToast({
      title: "Role assignment",
      message: "Assigning role...",
    });

    createUserRole({
      ...UserRole,
      userId: userIdParam,
    })
      .then((response) => {
        removeToast(toastId);
        if (response.errorCode) {
          pushToast({
            title: "Role assignment",
            message: response.message || "Failed to assign role",
            variant: "danger",
          });
        } else {
          if (userRolesFilter) {
            loadUserRoles(userRolesFilter);
          }
          pushToast({
            title: "Role assignment",
            message: "Role assigned successfully",
            variant: "success",
          });
        }
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  const onUserRoleDelete = (role: Role) => {
    setToDeleteRole(role);
    setShowDelete(true);
  };

  const performDeleteUserRole = (role: Role) => {
    if (!userIdParam || !role.id) {
      pushToast({
        title: "Role removal",
        message: "User ID or Role ID is missing",
        variant: "danger",
      });
      return;
    }

    const toastId = pushToast({
      title: "Role removal",
      message: "Removing role...",
    });

    deleteUserRole(new UserRole(userIdParam, role.id)).then((response) => {
      removeToast(toastId);

      if (response.errorCode) {
        pushToast({
          title: "Role removal",
          message: response.message || "Failed to delete role",
          variant: "danger",
        });
      } else {
        pushToast({
          title: "Role removal",
          message: "Role removed successfully",
          variant: "success",
        });
      }
      onUserRolesPageChange(currentUserRolePage);
    });
  };

  useEffect(() => {
    if (userIdParam) {
      queryUser(userIdParam);
    }
  }, [userIdParam, queryUser]);

  useEffect(() => {
    if (userIdParam) {
      const updated = !userRolesFilter
        ? new UserRoleFilter(userIdParam)
        : Object.assign(userRolesFilter, {
            userId: userIdParam,
          });

      loadUserRoles(updated);
    }
  }, [userIdParam, loadUserRoles, userRolesFilter]);

  if (isLoading) {
    return (
      <Container fluid="sm" className="my-2">
        <div className="w-100 text-center my-3">
          <Spinner animation="border" variant="primary" />
        </div>
      </Container>
    );
  }

  return (
    <Container fluid="sm" className="my-2">
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">User information</h1>

        <div>
          <Button onClick={() => navigate("/users")}>
            <ArrowLeft /> Back to user list
          </Button>
        </div>
      </div>

      <hr />

      {problem && userIdParam && (
        <LoadProblem
          problem={problem}
          item="user"
          onRetry={() => queryUser(userIdParam)}
        />
      )}

      {!!user && <UserDetails user={user} />}

      {!!user && !!userIdParam && <AccountMfaSection userId={userIdParam} />}

      {!!user && (
        <>
          <h2 className="mt-3">User roles</h2>

          <hr />

          <UserRoleForm
            isLoading={isCreating}
            onUserRoleSubmit={onUserRoleCreate}
            submitText="Assign role"
          />

          <UserRoleList
            items={userRoles}
            state={userRolesState}
            totalPages={userRoleTotalPages}
            currentPage={currentUserRolePage}
            onPageChange={onUserRolesPageChange}
            onRoleDelete={onUserRoleDelete}
          />
        </>
      )}

      <ConfirmationModal
        show={showDelete}
        title="Remove role"
        message={`Remove the role "${toDeleteRole?.name ?? ""}" from "${user?.name ?? ""}"?`}
        confirmLabel="Remove role"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (toDeleteRole) {
            performDeleteUserRole(toDeleteRole);
          }
          setShowDelete(false);
        }}
        onCancel={() => {
          setToDeleteRole(undefined);
          setShowDelete(false);
        }}
      />
    </Container>
  );
};

export const UserDetailsPage = withPageVisit(
  UserDetailsPageComponent,
  "UserDetails",
);
