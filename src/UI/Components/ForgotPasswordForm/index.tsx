import { type FC } from "react";
import { useForm } from "react-hook-form";
import { Button, Form, Spinner } from "react-bootstrap";

interface FormData {
  email: string;
}

export interface ForgotPasswordFormProps {
  onSubmitEmail: (email: string) => void;
  isLoading?: boolean;
}

export const ForgotPasswordForm: FC<ForgotPasswordFormProps> = ({
  onSubmitEmail,
  isLoading = false,
}) => {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const onSubmit = (data: FormData) => {
    onSubmitEmail(data.email);
  };

  return (
    <Form className="login-form w-100" data-bs-theme="dark" onSubmit={handleSubmit(onSubmit)}>
      <Form.Group className="w-100" controlId="email">
        <Form.Label className="form-label align-self-start m-0">Email Address</Form.Label>
        <Form.Control
          type="email"
          className="form-control"
          placeholder="name@example.com"
          {...register("email", { required: "Email is required" })}
          isInvalid={!!errors.email}
        />
        <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
      </Form.Group>

      <Button
        className="w-100"
        variant="primary"
        type="submit"
        disabled={!!errors.email || isLoading}
      >
        {isLoading ? (
          <>
            <Spinner animation="border" variant="light" size="sm" />
            <span className="ms-2">Sending...</span>
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>
    </Form>
  );
};
