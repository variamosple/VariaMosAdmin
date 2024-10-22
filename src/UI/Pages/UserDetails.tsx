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
import { FC, useEffect, useState } from "react";
import { Button, Container, Spinner } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmationModal from "../Components/ConfirmationModal";
import { UserDetails } from "../Components/UserDetails";
import { UserRoleForm } from "../Components/UserRoleForm";
import { UserRoleList } from "../Components/UserRoleList";
import { usePaginatedQuery } from "../Hooks/usePaginatedQuery";

export const UserDetailsPage: FC<unknown> = () => {
  const navigate = useNavigate();
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
    createUserRole({
      ...UserRole,
      userId: userIdParam!,
    })
      .then((response) => {
        if (!response.errorCode) {
          loadUserRoles(userRolesFilter!);
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
    // alertify.notify("Deleting role...", "info");

    deleteUserRole(new UserRole(userIdParam!, role.id!))
      .then((response) => {
        // alertify.dismissAll();

        if (response.errorCode) {
          // alertify.error(response.message);
        } else {
          // alertify.success("Role deleted successfully");
        }
        onUserRolesPageChange(currentUserRolePage);
      })
      .catch(() => {
        // alertify.error("Error when trying to delete the role");
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
