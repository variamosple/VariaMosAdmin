import { UserRegistration } from "@/Domain/User/Entity/UserRegistration";
import { PASSWORD_REGEXP } from "@/UI/constants";
import { useSession } from "@variamosple/variamos-components";
import { FC } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";
import "./styles.css";

export interface SignUpFormProps {
  onSignUp: (credentials: UserRegistration) => void;
}
export const SignUpForm: FC<SignUpFormProps> = ({ onSignUp }) => {
  const { isLoading } = useSession();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserRegistration>();

  const onSubmit: SubmitHandler<UserRegistration> = (data) => {
    if (!isLoading) {
      onSignUp(data);
    }
  };

  const password = watch("password");

  const validateConfirmPassword = (value: string) => {
    return value === password || "Passwords do not match";
  };

  return (
    <Form
      className="sign-up-form w-100"
      data-bs-theme="dark"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Form.Group className="w-100" controlId="name">
        <Form.Label className="form-label align-self-start m-0">
          Full Name
        </Form.Label>
        <Form.Control
          type="text"
          className="form-control"
          placeholder="Your full name"
          {...register("name", {
            required: "Full name is required",
          })}
          isInvalid={!!errors.name}
        />
        <Form.Control.Feedback type="invalid">
          {errors.name?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="w-100" controlId="email">
        <Form.Label className="form-label align-self-start m-0">
          Email Address
        </Form.Label>
        <Form.Control
          type="email"
          className="form-control"
          placeholder="name@example.com"
          {...register("email", { required: "Email is required" })}
          isInvalid={!!errors.email}
        />
        <Form.Control.Feedback type="invalid">
          {errors.email?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="w-100" controlId="password">
        <Form.Label className="form-label align-self-start m-0">
          Password
        </Form.Label>
        <Form.Control
          type="password"
          className="form-control"
          placeholder="Type your new pasword"
          {...register("password", {
            required: "password is required",
            pattern: {
              value: PASSWORD_REGEXP,
              message:
                "Password must be between 8 and 24 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
            },
          })}
          isInvalid={!!errors.password}
        />
        <Form.Control.Feedback type="invalid">
          {errors.password?.message}
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
            validate: validateConfirmPassword,
          })}
          isInvalid={!!errors.passwordConfirmation}
        />
        <Form.Control.Feedback type="invalid">
          {errors.passwordConfirmation?.message}
        </Form.Control.Feedback>
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
          "Sign up"
        )}
      </Button>
    </Form>
  );
};
