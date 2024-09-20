import { Credentials } from "@/Domain/User/Entity/Credentials";
import { FC, useState } from "react";
import { Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { GoogleLogin } from "../Components/GoogleLogin";
import { LoginForm } from "../Components/LoginForm";
import { useSession } from "../Context/SessionsContext";

export const LoginPage: FC<unknown> = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const { signIn } = useSession();

  const onSignIn = (credentials: Credentials) => {
    signIn(credentials).then((response) => setErrorMessage(response));
  };

  return (
    <>
      <LoginForm onSignIn={onSignIn} />

      <Alert
        className="w-100 m-0"
        variant="danger"
        show={!!errorMessage}
        dismissible
        onClose={() => setErrorMessage(undefined)}
      >
        {errorMessage}
      </Alert>

      <GoogleLogin />

      <div className="d-flex gap-1">
        <span>Don't have an account?</span>
        <Link className="text-decoration-none fw-bold" to="/sign-up">
          Sign up here
        </Link>
      </div>
    </>
  );
};
