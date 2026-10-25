import type { ResponseModel } from "@variamosple/variamos-components";
import { type FC, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { type SubmitHandler, useForm } from "react-hook-form";
import { usePasswordPolicy } from "@/features/auth/hooks/usePasswordPolicy";
import type { PasswordUpdate } from "@/features/user-management/domain/Entity/PasswordUpdate";

export interface PasswordUpdateFormProps {
  onUpdatePasswordSubmit: (
    passwordUpdate: PasswordUpdate,
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
  const passwordPolicy = usePasswordPolicy();
  // A refused update is told in the open modal, the input kept (UX-05)
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<PasswordUpdate> = (data) => {
    if (!isLoading) {
      setServerError(null);
      onUpdatePasswordSubmit(data).then((response) => {
        if (!response.errorCode) {
          reset();
        } else {
          setServerError(response.message || "The password was not updated.");
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
    setServerError(null);
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
          {serverError && (
            <Alert variant="danger" className="mb-0">
              {serverError}
            </Alert>
          )}
          <Form.Group className="w-100" controlId="currentPassword">
            <Form.Label className="form-label align-self-start m-0">
              Current password
            </Form.Label>
            <Form.Control
              type="password"
              className="form-control"
              placeholder="Type your current password"
              {...register("currentPassword", {
                required: "Current password is required",
              })}
              isInvalid={!!errors.currentPassword}
            />
            <Form.Control.Feedback type="invalid">
              {errors.currentPassword?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="w-100" controlId="newPassword">
            <Form.Label className="form-label align-self-start m-0">
              New password
            </Form.Label>
            <Form.Control
              type="password"
              className="form-control"
              placeholder="Type your new password"
              {...register("newPassword", {
                required: "New password is required",
                validate: passwordPolicy.validate,
              })}
              isInvalid={!!errors.newPassword}
            />
            <Form.Control.Feedback type="invalid">
              {errors.newPassword?.message}
            </Form.Control.Feedback>
            {!errors.newPassword && (
              <Form.Text muted>{passwordPolicy.message}</Form.Text>
            )}
          </Form.Group>

          <Form.Group className="w-100" controlId="passwordConfirm">
            <Form.Label className="form-label align-self-start m-0">
              Confirm Password
            </Form.Label>
            <Form.Control
              type="password"
              className="form-control"
              placeholder="Confirm your password"
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
                <Spinner
                  data-testid="loading-spinner"
                  animation="border"
                  variant="light"
                  size="sm"
                />
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
