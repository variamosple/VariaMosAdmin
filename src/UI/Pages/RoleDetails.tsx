import {
  createRolePermission,
  deleteRolePermission,
  queryRolePermissions,
} from "@/DataProviders/RolePermissionRepository";
import { queryRoleById } from "@/DataProviders/RoleRepository";
import { Permission } from "@/Domain/Permission/Entity/Permission";
import { Role } from "@/Domain/Role/Entity/Role";
import { RolePermission } from "@/Domain/Role/Entity/RolePermission";
import { RolePermissionFilter } from "@/Domain/Role/Entity/RolePermissionFilter";
import {
  usePaginatedQuery,
  withPageVisit,
} from "@variamosple/variamos-components";
import { FC, useEffect, useState } from "react";
import { Button, Container, Spinner } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmationModal from "../Components/ConfirmationModal";
import { RolePermissionForm } from "../Components/RolePermissionForm";
import { RolePermissionList } from "../Components/RolePermissionList";

const RoleDetailsPageComponent: FC<unknown> = () => {
  const navigate = useNavigate();
  const { roleId: roleIdParam } = useParams();
  const [role, setRole] = useState<Role>();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toDeletePermission, setToDeletePermission] = useState<Permission>();

  const {
    data: rolePermissions,
    currentPage: currentRolePermissionsPage,
    loadData: loadRolePermissions,
    totalPages: rolePermissionTotalPages,
    filter: rolePermissionsFilter,
    onPageChange: onRolePermissionsPageChange,
  } = usePaginatedQuery<RolePermissionFilter, Permission>({
    queryFunction: queryRolePermissions,
    initialFilter: new RolePermissionFilter(),
  });

  const queryRole = (roleId: number) => {
    setIsLoading(true);
    queryRoleById(roleId)
      .then((response) => {
        setRole(response.data);
      })
      .finally(() => setIsLoading(false));
  };

  const onRolePermissionCreate = (rolePermission: RolePermission) => {
    setIsCreating(true);
    createRolePermission({
      ...rolePermission,
      roleId: Number.parseInt(roleIdParam!),
    })
      .then((response) => {
        if (!response.errorCode) {
          loadRolePermissions(rolePermissionsFilter!);
        }
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  const onRolePermissionDelete = (permission: Permission) => {
    setToDeletePermission(permission);
    setShowDelete(true);
  };

  const performDeleteRolePermission = (permission: Permission) => {
    // alertify.notify("Deleting permission...", "info");

    deleteRolePermission(
      new RolePermission(Number.parseInt(roleIdParam!), permission.id!)
    )
      .then((response) => {
        // alertify.dismissAll();

        if (response.errorCode) {
          // alertify.error(response.message);
        } else {
          // alertify.success("Permission deleted successfully");
        }
        onRolePermissionsPageChange(1);
      })
      .catch(() => {
        // alertify.error("Error when trying to delete the permission");
      });
  };

  useEffect(() => {
    if (roleIdParam) {
      queryRole(Number.parseInt(roleIdParam));
    }
  }, [roleIdParam]);

  useEffect(() => {
    if (roleIdParam) {
      const updated = !rolePermissionsFilter
        ? new RolePermissionFilter(Number.parseInt(roleIdParam))
        : Object.assign(rolePermissionsFilter, {
            roleId: Number.parseInt(roleIdParam),
          });

      loadRolePermissions(updated);
    }
  }, [roleIdParam, loadRolePermissions, rolePermissionsFilter]);

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
        <h1 className="mb-0">{role?.name} Role</h1>

        <div>
          <Button onClick={() => navigate("/roles")}>
            <ArrowLeft /> Back To Role List
          </Button>
        </div>
      </div>

      <hr />

      <RolePermissionForm
        isLoading={isCreating}
        onRolePermissionSubmit={onRolePermissionCreate}
      />

      <RolePermissionList
        items={rolePermissions}
        totalPages={rolePermissionTotalPages}
        currentPage={currentRolePermissionsPage}
        onPageChange={onRolePermissionsPageChange}
        onPermissionDelete={onRolePermissionDelete}
      />

      <ConfirmationModal
        show={showDelete}
        message="Are you sure you want to remove the role permission?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performDeleteRolePermission(toDeletePermission!);
          setShowDelete(false);
        }}
        onCancel={() => {
          setToDeletePermission(undefined);
          setShowDelete(false);
        }}
      />
    </Container>
  );
};

export const RoleDetailsPage = withPageVisit(
  RoleDetailsPageComponent,
  "RoleDetails"
);
