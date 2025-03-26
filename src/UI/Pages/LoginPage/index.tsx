import { registerRedirect } from "@/DataProviders/AuthRepository";
import { Credentials } from "@/Domain/User/Entity/Credentials";
import { AppConfig } from "@/Infrastructure/AppConfig";
import { GoogleLogin } from "@/UI/Components/GoogleLogin";
import { LoginForm } from "@/UI/Components/LoginForm";
import { useRouter, useSession } from "@variamosple/variamos-components";
import { FC, useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";

export const LoginPage: FC<unknown> = () => {
  const { queryParams, navigate } = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const { signIn, signInAsGuest, isLoading } = useSession();

  const onSignIn = (credentials: Credentials) => {
    signIn(credentials).then((response) => {
      if (response.errorCode) {
        setErrorMessage(response.message);
      } else {
        navigate(response.data?.redirect || AppConfig.HOME_PAGE);
      }
    });
  };

  const onSignInAsGuest = () => {
    signInAsGuest().then((response) => {
      if (response.errorCode) {
        setErrorMessage(response.message);
      } else {
        navigate(response.data?.redirect || AppConfig.HOME_PAGE);
      }
    });
  };

  useEffect(() => {
    if (queryParams.has("errorMessage")) {
      setErrorMessage(queryParams.get("errorMessage")!);
    }

    if (queryParams.has("redirectTo")) {
      const decodedRedirectTo = decodeURIComponent(
        queryParams.get("redirectTo") || ""
      );

      registerRedirect(decodedRedirectTo).then();
    }
  }, [queryParams]);

  return (
    <div
      className="d-flex flex-column align-items-center gap-3 p-4 rounded-2 dark-container"
      style={{ width: 350 }}
      data-bs-theme="dark"
    >
      <img
        src="./images/VariaMosLogo.png"
        alt="Variamos logo"
        className="img-fluid"
      />

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
    </div>
  );
};
