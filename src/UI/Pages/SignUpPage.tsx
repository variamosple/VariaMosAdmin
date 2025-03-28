import { UserRegistration } from "@/Domain/User/Entity/UserRegistration";
import { useSession } from "@variamosple/variamos-components";
import { FC, useState } from "react";
import { Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { GoogleLogin } from "../Components/GoogleLogin";
import { SignUpForm } from "../Components/SignUpForm";

export const SignUpPage: FC<unknown> = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const { signUp } = useSession();

  const onSignUp = (registration: UserRegistration) => {
    signUp(registration).then((response) => {
      if (response?.errorCode) {
        setErrorMessage(response.message);
      } else if (response?.message) {
        setSuccessMessage(response.message);
      }
    });
  };

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
      <SignUpForm onSignUp={onSignUp} />

      <Alert
        className="w-100 m-0"
        variant="danger"
        show={!!errorMessage}
        dismissible
        onClose={() => setErrorMessage(undefined)}
      >
        {errorMessage}
      </Alert>

      <Alert
        className="w-100 m-0"
        variant="success"
        show={!!successMessage}
        dismissible
        onClose={() => setSuccessMessage(undefined)}
      >
        {successMessage}
      </Alert>

      <GoogleLogin text="signup_with" />

      <div className="d-flex gap-1">
        <span>Have an account?</span>
        <Link className="text-decoration-none fw-bold" to="/login">
          Sign in
        </Link>
      </div>
    </div>
  );
};
