import type { FC } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { EmailField } from "../EmailField";

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
    <Form
      className="login-form w-100"
      data-bs-theme="dark"
      onSubmit={handleSubmit(onSubmit)}
    >
      <EmailField
        registration={register("email", { required: "Email is required" })}
        error={errors.email}
      />

      <Button
        className="w-100"
        variant="primary"
        type="submit"
        disabled={Boolean(errors.email) || isLoading}
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
