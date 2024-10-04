import { Permission } from "@/Domain/Permission/Entity/Permission";
import { FC } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

export interface PermissionFormProps {
  defaultValue?: Permission;
  onPermissionSubmit: (permission: Permission) => void;
  isLoading: boolean;
  submitText?: string;
}

export const PermissionForm: FC<PermissionFormProps> = ({
  defaultValue,
  onPermissionSubmit,
  isLoading,
  submitText = "Create Permission",
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Permission>({ defaultValues: defaultValue });

  const onSubmit: SubmitHandler<Permission> = (data) => {
    if (!isLoading) {
      onPermissionSubmit(data);
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
          submitText
        )}
      </Button>
    </Form>
  );
};
