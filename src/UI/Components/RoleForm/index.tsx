import { Role } from "@/Domain/Role/Entity/Role";
import { FC } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

export interface RoleFormProps {
  onRoleCreate: (role: Role) => void;
  isLoading: boolean;
}

export const RoleForm: FC<RoleFormProps> = ({ onRoleCreate, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Role>();

  const onSubmit: SubmitHandler<Role> = (data) => {
    if (!isLoading) {
      onRoleCreate(data);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="name" className="col-6 col-md-4">
        <Form.Label className="form-label ">Role name</Form.Label>
        <Form.Control
          type="text"
          className="form-control "
          placeholder="Role name"
          {...register("name", { required: "Role name is required" })}
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
          "Create Role"
        )}
      </Button>
    </Form>
  );
};
