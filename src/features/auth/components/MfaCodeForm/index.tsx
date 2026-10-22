import type { FC } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { type SubmitHandler, useForm } from "react-hook-form";

interface MfaCodeFields {
  code: string;
  rememberDevice: boolean;
}

export interface MfaCodeFormProps {
  onSubmitCode: (code: string, rememberDevice: boolean) => void;
  onCancel: () => void;
  isLoading: boolean;
  /** Days this browser may skip the code; the choice is hidden at 0. */
  trustedDeviceDays?: number;
}

/** The second step of sign-in: a code from the app or a recovery code. */
export const MfaCodeForm: FC<MfaCodeFormProps> = ({
  onSubmitCode,
  onCancel,
  isLoading,
  trustedDeviceDays = 0,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaCodeFields>({ defaultValues: { rememberDevice: false } });

  const onSubmit: SubmitHandler<MfaCodeFields> = ({ code, rememberDevice }) => {
    if (!isLoading) {
      onSubmitCode(code.trim(), trustedDeviceDays > 0 && rememberDevice);
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

      {trustedDeviceDays > 0 && (
        <Form.Check
          id="mfa-remember-device"
          type="checkbox"
          label={`Don't ask for a code on this browser for ${trustedDeviceDays} day${trustedDeviceDays > 1 ? "s" : ""}`}
          {...register("rememberDevice")}
        />
      )}

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
