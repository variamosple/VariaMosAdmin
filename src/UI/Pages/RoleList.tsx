import { FC, useEffect } from "react";
import { Container } from "react-bootstrap";
import { queryRoles } from "../../DataProviders/RoleRepository";
import { Role } from "../../Domain/Role/Entity/Role";
import { RolesFilter } from "../../Domain/Role/Entity/RolesFilter";
import { RoleList } from "../Components/RoleList";
import { usePaginatedQuery } from "../Hooks/usePaginatedQuery";

export const RoleListPage: FC<unknown> = () => {
  const {
    data: roles,
    currentPage,
    loadData,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<RolesFilter, Role>({
    queryFunction: queryRoles,
    initialFilter: new RolesFilter(),
  });

  useEffect(() => {
    loadData(new RolesFilter());
  }, [loadData]);

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
