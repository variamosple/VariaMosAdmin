import { useRouter, withPageVisit } from "@variamosple/variamos-components";
import { type FC, useCallback, useEffect, useState } from "react";
import { Button, Container, Spinner } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { useParams } from "react-router-dom";
import type { Permission } from "@/features/permission-management/domain/Entity/Permission";
import {
  createRolePermission,
  deleteRolePermission,
  queryRolePermissions,
} from "@/features/role-management/api/RolePermissionRepository";
import { queryRoleById } from "@/features/role-management/api/RoleRepository";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { RolePermission } from "@/features/role-management/domain/Entity/RolePermission";
import { RolePermissionFilter } from "@/features/role-management/domain/Entity/RolePermissionFilter";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import {
  LoadProblem,
  type LoadProblemKind,
  loadProblemOf,
} from "@/shared/components/LoadProblem";
import { SearchForm } from "@/shared/components/SearchForm";
import { useToast } from "@/shared/context/ToastContext";
import { usePagedList } from "@/shared/hooks/usePagedList";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { RolePermissionForm } from "../components/RolePermissionForm";
import { RolePermissionList } from "../components/RolePermissionList";

const RoleDetailsPageComponent: FC = () => {
  const { pushToast, removeToast } = useToast();
  const { navigate } = useRouter();
  const { roleId: roleIdParam } = useParams();
  const [role, setRole] = useState<Role>();
  usePageTitle(role ? `Role ${role.name}` : "Role");
  const [problem, setProblem] = useState<LoadProblemKind | null>(null);
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
    listState: rolePermissionsState,
  } = usePagedList<RolePermissionFilter, Permission>({
    queryFunction: queryRolePermissions,
    initialFilter: new RolePermissionFilter(),
  });

  const queryRole = useCallback((roleId: number) => {
    setIsLoading(true);
    queryRoleById(roleId)
      .then((response) => {
        setProblem(loadProblemOf(response));
        setRole(response.data ?? undefined);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const onRolePermissionCreate = (rolePermission: RolePermission) => {
    setIsCreating(true);

    const toastId = pushToast({
      title: "Permission assignment",
      message: "Assigning permission...",
      variant: "info",
    });

    if (roleIdParam) {
      createRolePermission({
        ...rolePermission,
        roleId: Number.parseInt(roleIdParam, 10),
      })
        .then((response) => {
          removeToast(toastId);

          if (response.errorCode) {
            pushToast({
              title: "Permission assignment",
              message: response.message || "Failed to assign permission",
              variant: "danger",
            });
          } else {
            if (rolePermissionsFilter) {
              loadRolePermissions(rolePermissionsFilter);
            }

            pushToast({
              title: "Permission assignment",
              message: "Permission assigned successfully",
              variant: "success",
            });
          }
        })
        .finally(() => {
          setIsCreating(false);
        });
    } else {
      removeToast(toastId);
      setIsCreating(false);
    }
  };

  const onRolePermissionDelete = (permission: Permission) => {
    setToDeletePermission(permission);
    setShowDelete(true);
  };

  const performDeleteRolePermission = (permission: Permission) => {
    const toastId = pushToast({
      title: "Permission removal",
      message: "Removing permission...",
      variant: "info",
    });

    if (roleIdParam && permission.id !== undefined) {
      deleteRolePermission(
        new RolePermission(Number.parseInt(roleIdParam, 10), permission.id),
      ).then((response) => {
        removeToast(toastId);

        if (response.errorCode) {
          pushToast({
            title: "Permission removal",
            message: response.message ?? "An error occurred",
            variant: "danger",
          });
        } else {
          pushToast({
            title: "Permission removal",
            message: "Permission removed successfully",
            variant: "success",
          });
          onRolePermissionsPageChange(currentRolePermissionsPage);
        }
      });
    } else {
      removeToast(toastId);
    }
  };

  useEffect(() => {
    if (roleIdParam) {
      queryRole(Number.parseInt(roleIdParam, 10));
    }
  }, [roleIdParam, queryRole]);

  // The permissions of the role, all of them or those matching a search
  const searchRolePermissions = useCallback(
    (search?: string) => {
      if (roleIdParam) {
        void loadRolePermissions(
          new RolePermissionFilter(
            Number.parseInt(roleIdParam, 10),
            undefined,
            undefined,
            search || undefined,
          ),
        );
      }
    },
    [roleIdParam, loadRolePermissions],
  );

  useEffect(() => {
    searchRolePermissions();
  }, [searchRolePermissions]);

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
        {/* Never a bare "Role" title while the role is missing (UX-24) */}
        <h1 className="mb-0">{role ? `${role.name} Role` : "Role"}</h1>

        <div>
          <Button onClick={() => navigate("/roles")}>
            <ArrowLeft /> Back to role list
          </Button>
        </div>
      </div>

      <hr />

      {problem && roleIdParam && (
        <LoadProblem
          problem={problem}
          item="role"
          onRetry={() => queryRole(Number.parseInt(roleIdParam, 10))}
        />
      )}

      {!!role && (
        <>
          <RolePermissionForm
            isLoading={isCreating}
            onRolePermissionSubmit={onRolePermissionCreate}
          />

          <SearchForm
            isLoading={rolePermissionsState.isLoading}
            onSearchReset={() => searchRolePermissions()}
            onSubmit={searchRolePermissions}
            placeholder="Search the role's permissions by name or id"
          />

          <RolePermissionList
            items={rolePermissions}
            state={rolePermissionsState}
            totalPages={rolePermissionTotalPages}
            currentPage={currentRolePermissionsPage}
            onPageChange={onRolePermissionsPageChange}
            onPermissionDelete={onRolePermissionDelete}
          />
        </>
      )}

      <ConfirmationModal
        show={showDelete}
        title="Remove permission"
        message={`Remove the permission "${toDeletePermission?.name ?? ""}" from the role "${role?.name ?? ""}"?`}
        confirmLabel="Remove permission"
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (toDeletePermission) {
            performDeleteRolePermission(toDeletePermission);
          }
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
  "RoleDetails",
);
