import { createPermission } from "@/DataProviders/PermissionRepository";
import { Permission } from "@/Domain/Permission/Entity/Permission";
import { FC, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { PermissionForm } from "../Components/PermissionForm";

export const PermissionCreatePage: FC<unknown> = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onPermissionCreate = (permission: Permission) => {
    setIsLoading(true);
    createPermission(permission)
      .then((response) => {
        if (!response.errorCode) {
          navigate("/permissions");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Container fluid="sm" className="my-2">
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">Create a Permission</h1>

        <div>
          <Button onClick={() => navigate("/permissions")}>
            <ArrowLeft /> Back To Permission List
          </Button>
        </div>
      </div>

      <hr />

      <PermissionForm
        onPermissionSubmit={onPermissionCreate}
        isLoading={isLoading}
      />
    </Container>
  );
};
