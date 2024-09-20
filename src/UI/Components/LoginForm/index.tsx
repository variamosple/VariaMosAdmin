import { Credentials } from "@/Domain/User/Entity/Credentials";
import { useSession } from "@/UI/Context/SessionsContext";
import { FC } from "react";
import { Button, Form } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";
import "./styles.css";

export interface LoginFormProps {
  onSignIn: (credentials: Credentials) => void;
}

export const LoginForm: FC<LoginFormProps> = ({ onSignIn }) => {
  const { isLoading } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>();

  const onSubmit: SubmitHandler<Credentials> = (data) => {
    if (!isLoading) {
      onSignIn(data);
    }
  };

  return (
    <Form
      className="login-form w-100"
      data-bs-theme="dark"
      onSubmit={handleSubmit(onSubmit)}
    >
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
          placeholder="Type your pasword"
          {...register("password", { required: "password is required" })}
          isInvalid={!!errors.password}
        />
        <Form.Control.Feedback type="invalid">
          {errors.password?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Button
        className="w-100"
        variant="primary"
        type="submit"
        disabled={isLoading}
      >
        Sign in
      </Button>
    </Form>
  );
};
