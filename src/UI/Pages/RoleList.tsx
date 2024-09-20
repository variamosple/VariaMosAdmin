import { queryRoles } from "@/DataProviders/RoleRepository";
import { Role } from "@/Domain/Role/Entity/Role";
import { RolesFilter } from "@/Domain/Role/Entity/RolesFilter";
import { RoleList } from "@/UI/Components/RoleList";
import { usePaginatedQuery } from "@/UI/Hooks/usePaginatedQuery";
import { FC, useEffect } from "react";
import { Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export const RoleListPage: FC<unknown> = () => {
  const navigate = useNavigate();
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
    <Container fluid="sm" className="my-2">
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">Roles list</h1>

        <div>
          <Button onClick={() => navigate("/roles/create")}>Create Role</Button>
        </div>
      </div>
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
