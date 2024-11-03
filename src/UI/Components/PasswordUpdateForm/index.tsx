import { ResponseModel } from "@/Domain/Core/Entity/ResponseModel";
import { PasswordUpdate } from "@/Domain/User/Entity/PasswordUpdate";
import { PASSWORD_REGEXP } from "@/UI/constants";
import { FC } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

export interface PasswordUpdateFormProps {
  onUpdatePasswordSubmit: (
    passwordUpdate: PasswordUpdate
  ) => Promise<ResponseModel<void>>;
  showModal: boolean;
  onClose: () => void;
  isLoading: boolean;
}

export const PasswordUpdateForm: FC<PasswordUpdateFormProps> = ({
  onUpdatePasswordSubmit,
  showModal,
  onClose,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<PasswordUpdate>();

  const onSubmit: SubmitHandler<PasswordUpdate> = (data) => {
    if (!isLoading) {
      onUpdatePasswordSubmit(data).then((response) => {
        if (!response.errorCode) {
          reset();
        }
      });
    }
  };

  const newPassword = watch("newPassword");

  const validatePasswordConfirmation = (value: string) => {
    return value === newPassword || "Passwords do not match";
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
        <Modal.Title>Password update</Modal.Title>
      </Modal.Header>
      <Form className="w-100" onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body className="d-flex flex-column gap-2">
          <Form.Group className="w-100" controlId="newPassword">
            <Form.Label className="form-label align-self-start m-0">
              Currrent password
            </Form.Label>
            <Form.Control
              type="password"
              className="form-control"
              placeholder="Type your current pasword"
              {...register("currentPassword", {
                required: "Current password is required",
              })}
              isInvalid={!!errors.currentPassword}
            />
            <Form.Control.Feedback type="invalid">
              {errors.currentPassword?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="w-100" controlId="currentPassword">
            <Form.Label className="form-label align-self-start m-0">
              New password
            </Form.Label>
            <Form.Control
              type="password"
              className="form-control"
              placeholder="Type your new pasword"
              {...register("newPassword", {
                required: "New password is required",
                pattern: {
                  value: PASSWORD_REGEXP,
                  message:
                    "New password must be between 8 and 24 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
                },
              })}
              isInvalid={!!errors.newPassword}
            />
            <Form.Control.Feedback type="invalid">
              {errors.newPassword?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="w-100" controlId="passwordConfirm">
            <Form.Label className="form-label align-self-start m-0">
              Confirm Password
            </Form.Label>
            <Form.Control
              type="password"
              className="form-control"
              placeholder="Confirm your pasword"
              {...register("passwordConfirmation", {
                required: "Please confirm your password",
                validate: validatePasswordConfirmation,
              })}
              isInvalid={!!errors.passwordConfirmation}
            />
            <Form.Control.Feedback type="invalid">
              {errors.passwordConfirmation?.message}
            </Form.Control.Feedback>
          </Form.Group>

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
                "Update Password"
              )}
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Form>
    </Modal>
  );
};
