import { FC, useCallback, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { queryRoles } from "../../DataProviders/RoleRepository";
import { Role } from "../../Domain/Role/Entity/Role";
import { RolesFilter } from "../../Domain/Role/Entity/RolesFilter";
import { RoleList } from "../Components/RoleList";

export const RoleListPage: FC<unknown> = () => {
  const [isLoading, setIsloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesFilter, setRolesFilter] = useState(new RolesFilter());
  const [totalPages, setTotalPages] = useState(1);

  const loadRoles = useCallback((filter: RolesFilter = new RolesFilter()) => {
    setRolesFilter(filter);
    setIsloading(true);

    queryRoles(filter)
      .then((response) => {
        setRoles(response.data ?? []);
        setTotalPages(Math.ceil((response.totalCount || 0) / 20));
      })
      .finally(() => {
        setIsloading(false);
      });
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const onPageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    loadRoles(
      Object.assign(new RolesFilter(), rolesFilter, {
        pageNumber,
      })
    );
  };

  return (
    <Container>
      <h1>Roles list</h1>
      <hr />

      <RoleList
        items={roles}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    </Container>
  );
};
