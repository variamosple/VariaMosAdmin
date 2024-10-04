import { createRole } from "@/DataProviders/RoleRepository";
import { Role } from "@/Domain/Role/Entity/Role";
import { FC, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
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
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">Create a Role</h1>

        <div>
          <Button onClick={() => navigate("/roles")}>
            <ArrowLeft /> Back To Role List
          </Button>
        </div>
      </div>

      <hr />

      <RoleForm onRoleSubmit={onRoleCreate} isLoading={isLoading} />
    </Container>
  );
};
