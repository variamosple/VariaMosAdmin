import { type FC } from "react";
import { useForm } from "react-hook-form";
import { Button, Form, Spinner } from "react-bootstrap";
import { PASSWORD_REGEXP } from "@/UI/constants";

interface FormData {
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordFormProps {
  onSubmitPassword: (password: string) => void;
  isLoading?: boolean;
}

export const ResetPasswordForm: FC<ResetPasswordFormProps> = ({
  onSubmitPassword,
  isLoading = false,
}) => {
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
    mode: "onChange",
  });

  const newPassword = watch("new_password");

  const validatePasswordConfirmation = (value: string) => {
    return value === newPassword || "Passwords do not match";
  };

  const onSubmit = (data: FormData) => {
    onSubmitPassword(data.new_password);
  };

  return (
    <Form
      className="login-form w-100"
      data-bs-theme="dark"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Form.Group className="w-100 mb-3" controlId="new_password">
        <Form.Label className="form-label align-self-start m-0">
          New Password
        </Form.Label>
        <Form.Control
          type="password"
          className="form-control"
          placeholder="Type your new password"
          {...register("new_password", {
            required: "New password is required",
            pattern: {
              value: PASSWORD_REGEXP,
              message:
                "Password must be between 8 and 24 characters and include uppercase, lowercase, number, and special character.",
            },
          })}
          isInvalid={!!errors.new_password}
        />
        <Form.Control.Feedback type="invalid">
          {errors.new_password?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="w-100 mb-3" controlId="confirm_password">
        <Form.Label className="form-label align-self-start m-0">
          Confirm Password
        </Form.Label>
        <Form.Control
          type="password"
          className="form-control"
          placeholder="Confirm your password"
          {...register("confirm_password", {
            required: "Confirm password is required",
            validate: validatePasswordConfirmation,
          })}
          isInvalid={!!errors.confirm_password}
        />
        <Form.Control.Feedback type="invalid">
          {errors.confirm_password?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Button
        className="w-100"
        variant="primary"
        type="submit"
        disabled={
          !!errors.new_password || !!errors.confirm_password || isLoading
        }
      >
        {isLoading ? (
          <>
            <Spinner animation="border" variant="light" size="sm" />
            <span className="ms-2">Updating...</span>
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </Form>
  );
};
