import { Role } from "@/Domain/Role/Entity/Role";
import { ResponseModel } from "@variamosple/variamos-components";
import { FC, useEffect } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

export interface RoleFormModalProps {
  modalTitle: string;
  showModal: boolean;
  onClose: () => void;
  defaultValue?: Role;
  onRoleSubmit: (role: Role) => Promise<ResponseModel<Role>>;
  isLoading: boolean;
  submitText?: string;
}

export const RoleFormModal: FC<RoleFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onRoleSubmit,
  isLoading,
  submitText = "Create role",
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Role>();

  useEffect(() => {
    reset({ ...defaultValue });
  }, [defaultValue, reset]);

  const onSubmit: SubmitHandler<Role> = (data) => {
    if (!isLoading) {
      onRoleSubmit(data).then((response) => {
        if (!response.errorCode) {
          reset();
        }
      });
    }
  };

  const onCloseModal = () => {
    onClose();
    reset();
  };

  return (
    <Modal
      show={showModal}
      backdrop={isLoading ? "static" : true}
      onHide={onCloseModal}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <Form.Group controlId="name" className="col-12 col-md-8">
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
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onCloseModal}
          >
            Cancel
          </Button>

          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <Spinner animation="border" variant="light" size="sm" />
            ) : (
              submitText
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
