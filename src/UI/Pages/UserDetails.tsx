import { queryUserById } from "@/DataProviders/UserRepository";
import {
  createUserRole,
  deleteUserRole,
  queryUserRoles,
} from "@/DataProviders/UserRoleRepository";
import { Role } from "@/Domain/Role/Entity/Role";
import { User } from "@/Domain/User/Entity/User";
import { UserRole } from "@/Domain/User/Entity/UserRole";
import { UserRoleFilter } from "@/Domain/User/Entity/UserRoleFilter";
import {
  usePaginatedQuery,
  useRouter,
  withPageVisit,
} from "@variamosple/variamos-components";
import { FC, useEffect, useState } from "react";
import { Button, Container, Spinner } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { useParams } from "react-router-dom";
import ConfirmationModal from "../Components/ConfirmationModal";
import { UserDetails } from "../Components/UserDetails";
import { UserRoleForm } from "../Components/UserRoleForm";
import { UserRoleList } from "../Components/UserRoleList";
import { useToast } from "../Context/ToastContext";

const UserDetailsPageComponent: FC<unknown> = () => {
  const { pushToast, removeToast } = useToast();
  const { navigate } = useRouter();
  const { userId: userIdParam } = useParams();
  const [user, setUser] = useState<User>();
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
  } = usePaginatedQuery<UserRoleFilter, Role>({
    queryFunction: queryUserRoles,
    initialFilter: new UserRoleFilter(),
  });

  const queryUser = (userId: string) => {
    setIsLoading(true);
    queryUserById(userId)
      .then((response) => {
        setUser(response.data);
      })
      .finally(() => setIsLoading(false));
  };

  const onUserRoleCreate = (UserRole: UserRole) => {
    setIsCreating(true);
    const toastId = pushToast({
      title: "Role assignment",
      message: "Deleting role...",
    });

    createUserRole({
      ...UserRole,
      userId: userIdParam!,
    })
      .then((response) => {
        removeToast(toastId);
        if (response.errorCode) {
          pushToast({
            title: "Role assignment",
            message: response.message!,
            variant: "danger",
          });
        } else {
          loadUserRoles(userRolesFilter!);
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
    const toastId = pushToast({
      title: "Role delete",
      message: "Deleting role...",
    });

    deleteUserRole(new UserRole(userIdParam!, role.id!)).then((response) => {
      removeToast(toastId);

      if (response.errorCode) {
        pushToast({
          title: "Role delete",
          message: response.message!,
          variant: "danger",
        });
      } else {
        pushToast({
          title: "Role delete",
          message: "Role deleted successfully",
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
  }, [userIdParam]);

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
            <ArrowLeft /> Back To User List
          </Button>
        </div>
      </div>

      <hr />

      {!!user && <UserDetails user={user} />}

      <h2 className="mt-3">User roles</h2>

      <hr />

      <UserRoleForm
        isLoading={isCreating}
        onUserRoleSubmit={onUserRoleCreate}
        submitText="Assign role"
      />

      <UserRoleList
        items={userRoles}
        totalPages={userRoleTotalPages}
        currentPage={currentUserRolePage}
        onPageChange={onUserRolesPageChange}
        onRoleDelete={onUserRoleDelete}
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to remove the user role?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performDeleteUserRole(toDeleteRole!);
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
  "UserDetails"
);
