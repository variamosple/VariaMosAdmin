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
import { resultToastOf } from "@/shared/hooks/useListChange";
import { usePagedList } from "@/shared/hooks/usePagedList";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { RolePermissionForm } from "../components/RolePermissionForm";
import { RolePermissionList } from "../components/RolePermissionList";

// The role named by the address, read again on a retry
const useRole = (roleIdParam?: string) => {
  const [role, setRole] = useState<Role>();
  const [problem, setProblem] = useState<LoadProblemKind | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const queryRole = useCallback((roleId: number) => {
    setIsLoading(true);
    void queryRoleById(roleId)
      .then((response) => {
        setProblem(loadProblemOf(response));
        setRole(response.data ?? undefined);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (roleIdParam) {
      queryRole(Number.parseInt(roleIdParam, 10));
    }
  }, [roleIdParam, queryRole]);

  return { role, problem, isLoading, queryRole };
};

const usePermissionsOfRole = () =>
  usePagedList<RolePermissionFilter, Permission>({
    queryFunction: queryRolePermissions,
    initialFilter: new RolePermissionFilter(),
  });

type PermissionsOfRole = ReturnType<typeof usePermissionsOfRole>;

// The permissions of the role, all of them or those matching a search
const usePermissionSearch = (
  roleIdParam: string | undefined,
  loadData: PermissionsOfRole["loadData"],
) => {
  const searchRolePermissions = useCallback(
    (search?: string) => {
      if (roleIdParam) {
        void loadData(
          new RolePermissionFilter(
            Number.parseInt(roleIdParam, 10),
            undefined,
            undefined,
            search || undefined,
          ),
        );
      }
    },
    [roleIdParam, loadData],
  );

  useEffect(() => {
    searchRolePermissions();
  }, [searchRolePermissions]);

  return searchRolePermissions;
};

// Assigning a permission to the role, and removing one
const usePermissionChanges = (
  roleIdParam: string | undefined,
  permissions: PermissionsOfRole,
) => {
  const { pushToast, removeToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const onRolePermissionCreate = (rolePermission: RolePermission) => {
    setIsCreating(true);
    const toastId = pushToast({
      title: "Permission assignment",
      message: "Assigning permission...",
      variant: "info",
    });
    if (!roleIdParam) {
      removeToast(toastId);
      setIsCreating(false);
      return;
    }
    void createRolePermission({
      ...rolePermission,
      roleId: Number.parseInt(roleIdParam, 10),
    })
      .then((response) => {
        removeToast(toastId);
        if (!response.errorCode && permissions.filter) {
          void permissions.loadData(permissions.filter);
        }
        pushToast(
          resultToastOf(response, {
            title: "Permission assignment",
            success: "Permission assigned successfully",
            failure: "Failed to assign permission",
          }),
        );
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  const performDeleteRolePermission = (permission: Permission) => {
    const toastId = pushToast({
      title: "Permission removal",
      message: "Removing permission...",
      variant: "info",
    });
    if (!roleIdParam || permission.id === undefined) {
      removeToast(toastId);
      return;
    }
    void deleteRolePermission(
      new RolePermission(Number.parseInt(roleIdParam, 10), permission.id),
    ).then((response) => {
      removeToast(toastId);
      pushToast(
        resultToastOf(response, {
          title: "Permission removal",
          success: "Permission removed successfully",
        }),
      );
      if (!response.errorCode) {
        permissions.onPageChange(permissions.currentPage);
      }
    });
  };

  return { isCreating, onRolePermissionCreate, performDeleteRolePermission };
};

const LoadingPage: FC = () => (
  <Container fluid="sm" className="my-2">
    <div className="w-100 text-center my-3">
      <Spinner animation="border" variant="primary" />
    </div>
  </Container>
);

const RoleDetailsPageComponent: FC = () => {
  const { navigate } = useRouter();
  const { roleId: roleIdParam } = useParams();
  const permissions = usePermissionsOfRole();
  const { role, problem, isLoading, queryRole } = useRole(roleIdParam);
  usePageTitle(role ? `Role ${role.name}` : "Role");
  const searchRolePermissions = usePermissionSearch(
    roleIdParam,
    permissions.loadData,
  );
  const changes = usePermissionChanges(roleIdParam, permissions);
  const [showDelete, setShowDelete] = useState(false);
  const [toDeletePermission, setToDeletePermission] = useState<Permission>();

  if (isLoading) return <LoadingPage />;

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

      {problem && roleIdParam ? (
        <LoadProblem
          problem={problem}
          item="role"
          onRetry={() => queryRole(Number.parseInt(roleIdParam, 10))}
        />
      ) : null}

      {Boolean(role) && (
        <>
          <RolePermissionForm
            isLoading={changes.isCreating}
            onRolePermissionSubmit={changes.onRolePermissionCreate}
          />

          <SearchForm
            isLoading={permissions.listState.isLoading}
            onSearchReset={() => searchRolePermissions()}
            onSubmit={searchRolePermissions}
            placeholder="Search the role's permissions by name or id"
          />

          <RolePermissionList
            items={permissions.data}
            state={permissions.listState}
            totalPages={permissions.totalPages}
            currentPage={permissions.currentPage}
            onPageChange={permissions.onPageChange}
            onPermissionDelete={(permission) => {
              setToDeletePermission(permission);
              setShowDelete(true);
            }}
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
            changes.performDeleteRolePermission(toDeletePermission);
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
