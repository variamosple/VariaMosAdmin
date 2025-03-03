import { Permission } from "@/Domain/Permission/Entity/Permission";
import { ResponseModel } from "@variamosple/variamos-components";
import { FC, useEffect } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

export interface PermissionFormModalProps {
  modalTitle: string;
  showModal: boolean;
  onClose: () => void;
  defaultValue?: Permission;
  onPermissionSubmit: (
    permission: Permission
  ) => Promise<ResponseModel<Permission>>;
  isLoading: boolean;
  submitText?: string;
}

export const PermissionFormModal: FC<PermissionFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onPermissionSubmit,
  isLoading,
  submitText = "Create Permission",
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Permission>();

  useEffect(() => {
    reset({ ...defaultValue });
  }, [defaultValue, reset]);

  const onSubmit: SubmitHandler<Permission> = (data) => {
    if (!isLoading) {
      onPermissionSubmit(data).then((response) => {
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
