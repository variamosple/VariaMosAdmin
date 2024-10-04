import { createRole } from "@/DataProviders/RoleRepository";
import { Role } from "@/Domain/Role/Entity/Role";
import { FC, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleForm } from "../Components/RoleForm";

export const RoleCreatePage: FC<unknown> = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onRoleCreate = (role: Role) => {
    setIsLoading(true);
    createRole(role)
      .then((response) => {
        if (!response.errorCode) {
          navigate("/roles");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">Create a Role</h1>

      <hr />

      <RoleForm onRoleSubmit={onRoleCreate} isLoading={isLoading} />
    </Container>
  );
};
