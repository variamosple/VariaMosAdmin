import { FC, useEffect } from "react";
import { Container } from "react-bootstrap";
import { queryPermissions } from "../../DataProviders/PermissionRepository";
import { Permission } from "../../Domain/Permission/Entity/Permission";
import { PermissionsFilter } from "../../Domain/Permission/Entity/PermissionsFilter";
import { PermissionList } from "../Components/PermissionList";
import { usePaginatedQuery } from "../Hooks/usePaginatedQuery";

export const PermissionListPage: FC<unknown> = () => {
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
    <Container>
      <h1>Permissions list</h1>
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
