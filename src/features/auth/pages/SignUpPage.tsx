import { useSession } from "@variamosple/variamos-components";
import { type FC, useState } from "react";
import { Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import type { UserRegistration } from "@/features/user-management/domain/Entity/UserRegistration";
import { GoogleLogin } from "../components/GoogleLogin";
import { SignUpForm } from "../components/SignUpForm";

export const SignUpPage: FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [signedUp, setSignedUp] = useState(false);
  const { signUp } = useSession();

  const onSignUp = (registration: UserRegistration) => {
    signUp(registration).then((response) => {
      if (response?.errorCode) {
        setErrorMessage(response.message);
      } else if (response) {
        setSignedUp(true);
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
        src="./images/VariaMosLogo.webp"
        width={1200}
        height={245}
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
        show={signedUp}
        dismissible
        onClose={() => setSignedUp(false)}
      >
        {/* The API answers the same for a taken address, so as not to tell
            who has an account: the text covers both cases (UX-33) */}
        If this email address was not registered yet, your account is ready.
        Already registered?{" "}
        <Link className="alert-link" to="/forgot-password">
          Reset your password
        </Link>
        .
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
