import { Credentials } from "@/Domain/User/Entity/Credentials";
import { FC, useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { GoogleLogin } from "../Components/GoogleLogin";
import { LoginForm } from "../Components/LoginForm";
import { useSession } from "../Context/SessionsContext";

export const LoginPage: FC<unknown> = () => {
  let [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const { signIn, signInAsGuest, isLoading } = useSession();

  const onSignIn = (credentials: Credentials) => {
    signIn(credentials).then((response) => setErrorMessage(response));
  };

  const onSignInAsGuest = () => {
    signInAsGuest().then((response) => setErrorMessage(response));
  };

  useEffect(() => {
    if (searchParams.has("errorMessage")) {
      setErrorMessage(searchParams.get("errorMessage")!);
    }
  }, [searchParams]);

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

      <Button
        variant="link"
        className="text-decoration-none text-decoration-underline-hover p-0"
        onClick={onSignInAsGuest}
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner animation="border" variant="light" size="sm" />
        ) : (
          " Continue as a Guest"
        )}
      </Button>

      <div className="d-flex gap-1">
        <span>Don't have an account?</span>
        <Link className="text-decoration-none  fw-bold" to="/sign-up">
          Sign up here
        </Link>
      </div>
    </>
  );
};
