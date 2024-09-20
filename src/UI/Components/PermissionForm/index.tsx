import { Permission } from "@/Domain/Permission/Entity/Permission";
import { FC } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

export interface PermissionFormProps {
  onPermissionCreate: (permission: Permission) => void;
  isLoading: boolean;
}

export const PermissionForm: FC<PermissionFormProps> = ({
  onPermissionCreate,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Permission>();

  const onSubmit: SubmitHandler<Permission> = (data) => {
    if (!isLoading) {
      onPermissionCreate(data);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Group className="col-6 col-md-4" controlId="name">
        <Form.Label className="form-label">Permission name</Form.Label>
        <Form.Control
          type="text"
          className="form-control"
          placeholder="Permission name"
          {...register("name", { required: "Permission name is required" })}
          isInvalid={!!errors.name}
        />
        <Form.Control.Feedback type="invalid">
          {errors.name?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Button
        className="mt-3"
        variant="primary"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner animation="border" variant="light" size="sm" />
        ) : (
          "Create Permission"
        )}
      </Button>
    </Form>
  );
};
