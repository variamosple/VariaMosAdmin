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
import { resultToastOf } from "@/shared/hooks/useListChange";
import { usePagedList } from "@/shared/hooks/usePagedList";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { UserRoleForm } from "../components/UserRoleForm";
import { UserRoleList } from "../components/UserRoleList";

// The account named by the address, read again on a retry
const useUser = (userIdParam?: string) => {
  const [user, setUser] = useState<User>();
  const [problem, setProblem] = useState<LoadProblemKind | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const queryUser = useCallback((userId: string) => {
    setIsLoading(true);
    void queryUserById(userId)
      .then((response) => {
        setProblem(loadProblemOf(response));
        setUser(response.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (userIdParam) {
      queryUser(userIdParam);
    }
  }, [userIdParam, queryUser]);

  return { user, problem, isLoading, queryUser };
};

const useRolesOfUser = () =>
  usePagedList<UserRoleFilter, Role>({
    queryFunction: queryUserRoles,
    initialFilter: new UserRoleFilter(),
  });

type RolesOfUser = ReturnType<typeof useRolesOfUser>;

// The roles of the account, read again when it changes
const useUserRolesLoad = (
  userIdParam: string | undefined,
  roles: RolesOfUser,
) => {
  const { loadData, filter } = roles;
  useEffect(() => {
    if (userIdParam) {
      const updated = filter
        ? Object.assign(filter, {
            userId: userIdParam,
          })
        : new UserRoleFilter(userIdParam);

      void loadData(updated);
    }
  }, [userIdParam, loadData, filter]);
};

// Assigning a role to the account, and removing one
const useRoleChanges = (
  userIdParam: string | undefined,
  roles: RolesOfUser,
) => {
  const { pushToast, removeToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const onUserRoleCreate = (userRole: UserRole) => {
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

    void createUserRole({ ...userRole, userId: userIdParam })
      .then((response) => {
        removeToast(toastId);
        if (!response.errorCode && roles.filter) {
          void roles.loadData(roles.filter);
        }
        pushToast(
          resultToastOf(response, {
            title: "Role assignment",
            success: "Role assigned successfully",
            failure: "Failed to assign role",
          }),
        );
      })
      .finally(() => {
        setIsCreating(false);
      });
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

    void deleteUserRole(new UserRole(userIdParam, role.id)).then((response) => {
      removeToast(toastId);
      pushToast(
        resultToastOf(response, {
          title: "Role removal",
          success: "Role removed successfully",
          failure: "Failed to delete role",
        }),
      );
      roles.onPageChange(roles.currentPage);
    });
  };

  return { isCreating, onUserRoleCreate, performDeleteUserRole };
};

const LoadingPage: FC = () => (
  <Container fluid="sm" className="my-2">
    <div className="w-100 text-center my-3">
      <Spinner animation="border" variant="primary" />
    </div>
  </Container>
);

const UserDetailsPageComponent: FC = () => {
  const { navigate } = useRouter();
  const { userId: userIdParam } = useParams();
  const roles = useRolesOfUser();
  const { user, problem, isLoading, queryUser } = useUser(userIdParam);
  usePageTitle(user ? `User ${user.name}` : "User");
  useUserRolesLoad(userIdParam, roles);
  const changes = useRoleChanges(userIdParam, roles);
  const [showDelete, setShowDelete] = useState(false);
  const [toDeleteRole, setToDeleteRole] = useState<Role>();

  if (isLoading) return <LoadingPage />;

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

      {problem && userIdParam ? (
        <LoadProblem
          problem={problem}
          item="user"
          onRetry={() => queryUser(userIdParam)}
        />
      ) : null}

      {user ? <UserDetails user={user} /> : null}

      {user && userIdParam ? <AccountMfaSection userId={userIdParam} /> : null}

      {user ? (
        <>
          <h2 className="mt-3">User roles</h2>

          <hr />

          <UserRoleForm
            isLoading={changes.isCreating}
            onUserRoleSubmit={changes.onUserRoleCreate}
            submitText="Assign role"
          />

          <UserRoleList
            items={roles.data}
            state={roles.listState}
            totalPages={roles.totalPages}
            currentPage={roles.currentPage}
            onPageChange={roles.onPageChange}
            onRoleDelete={(role) => {
              setToDeleteRole(role);
              setShowDelete(true);
            }}
          />
        </>
      ) : null}

      <ConfirmationModal
        show={showDelete}
        title="Remove role"
        message={`Remove the role "${toDeleteRole?.name ?? ""}" from "${user?.name ?? ""}"?`}
        confirmLabel="Remove role"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (toDeleteRole) {
            changes.performDeleteUserRole(toDeleteRole);
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
