import { queryPermissions } from "@/DataProviders/PermissionRepository";
import { Permission } from "@/Domain/Permission/Entity/Permission";
import { PermissionsFilter } from "@/Domain/Permission/Entity/PermissionsFilter";
import { FC, useEffect } from "react";
import { Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { PermissionList } from "../Components/PermissionList";
import { usePaginatedQuery } from "../Hooks/usePaginatedQuery";

export const PermissionListPage: FC<unknown> = () => {
  const navigate = useNavigate();
  const {
    data: permissions,
    currentPage,
    loadData,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<PermissionsFilter, Permission>({
    queryFunction: queryPermissions,
    initialFilter: new PermissionsFilter(),
  });

  useEffect(() => {
    loadData(new PermissionsFilter());
  }, [loadData]);

  return (
    <Container fluid="sm" className="my-2">
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">Permissions list</h1>

        <div>
          <Button onClick={() => navigate("/permissions/create")}>
            Create Permission
          </Button>
        </div>
      </div>
      <hr />

      <PermissionList
        items={permissions}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    </Container>
  );
};
