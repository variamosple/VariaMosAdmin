import type { FC } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { type SubmitHandler, useForm } from "react-hook-form";

interface MfaCodeFields {
  code: string;
}

export interface MfaCodeFormProps {
  onSubmitCode: (code: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

/** The second step of sign-in: a code from the app or a recovery code. */
export const MfaCodeForm: FC<MfaCodeFormProps> = ({
  onSubmitCode,
  onCancel,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaCodeFields>();

  const onSubmit: SubmitHandler<MfaCodeFields> = ({ code }) => {
    if (!isLoading) {
      onSubmitCode(code.trim());
    }
  };

  return (
    <Form
      className="w-100 d-flex flex-column gap-2"
      data-bs-theme="dark"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Form.Group className="w-100" controlId="mfa-code">
        <Form.Label className="form-label align-self-start m-0">
          Authentication code
        </Form.Label>
        <Form.Control
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="123456"
          maxLength={32}
          {...register("code", { required: "The code is required" })}
          isInvalid={!!errors.code}
        />
        <Form.Control.Feedback type="invalid">
          {errors.code?.message}
        </Form.Control.Feedback>
        <Form.Text className="text-light-emphasis">
          Open your authenticator app, or type one of your recovery codes.
        </Form.Text>
      </Form.Group>

      <Button
        className="w-100"
        variant="primary"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner animation="border" variant="light" size="sm" />
        ) : (
          "Verify"
        )}
      </Button>
      <Button
        variant="link"
        className="text-decoration-none p-0"
        onClick={onCancel}
        disabled={isLoading}
      >
        Back to sign in
      </Button>
    </Form>
  );
};
