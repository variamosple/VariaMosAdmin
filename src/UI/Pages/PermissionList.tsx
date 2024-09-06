import { FC, useCallback, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { queryPermissions } from "../../DataProviders/PermissionRepository";
import { Permission } from "../../Domain/Permission/Entity/Permission";
import { PermissionsFilter } from "../../Domain/Permission/Entity/PermissionsFilter";
import { PermissionList } from "../Components/PermissionList";

export const PermissionListPage: FC<unknown> = () => {
  const [isLoading, setIsloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsFilter, setPermissionsFilter] = useState(
    new PermissionsFilter()
  );
  const [totalPages, setTotalPages] = useState(1);

  const loadPermissions = useCallback(
    (filter: PermissionsFilter = new PermissionsFilter()) => {
      setPermissionsFilter(filter);
      setIsloading(true);

      queryPermissions(filter)
        .then((response) => {
          setPermissions(response.data ?? []);
          setTotalPages(Math.ceil((response.totalCount || 0) / 20));
        })
        .finally(() => {
          setIsloading(false);
        });
    },
    []
  );

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const onPageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    loadPermissions(
      Object.assign(new PermissionsFilter(), permissionsFilter, {
        pageNumber,
      })
    );
  };

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
