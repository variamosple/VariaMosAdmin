import { useRouter, useSession } from "@variamosple/variamos-components";
import { type FC, useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import type { Credentials } from "@/features/user-management/domain/Entity/Credentials";
import { loginMessageOf } from "@/shared/api/errorMessages";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { pageLoader } from "@/shared/infrastructure/PageLoader";
import { registerRedirect } from "../../api/AuthRepository";
import { requestSignInMfa } from "../../api/MfaRepository";
import { GoogleLogin } from "../../components/GoogleLogin";
import { LoginForm } from "../../components/LoginForm";
import { MfaCodeForm } from "../../components/MfaCodeForm";

export const LoginPage: FC = () => {
  const { queryParams, navigate } = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [trustedDeviceDays, setTrustedDeviceDays] = useState(0);
  const { signIn, signInAsGuest, isLoading } = useSession();

  const onSignIn = (credentials: Credentials) => {
    signIn(credentials).then((response) => {
      // Right password, second factor on: the code is still expected
      const data = response.data as {
        mfaRequired?: boolean;
        trustedDeviceDays?: number;
      } | null;
      if (data?.mfaRequired) {
        setErrorMessage(undefined);
        setTrustedDeviceDays(data.trustedDeviceDays ?? 0);
        setIsMfaStep(true);
      } else if (response.errorCode) {
        setErrorMessage(response.message);
      } else {
        navigate(response.data?.redirect || AppConfig.HOME_PAGE);
      }
    });
  };

  const onSubmitCode = (code: string, rememberDevice: boolean) => {
    setIsCheckingCode(true);
    requestSignInMfa(code, rememberDevice)
      .then((response) => {
        if (!response.errorCode) {
          pageLoader.load(response.data?.redirect || AppConfig.HOME_PAGE);
          return;
        }
        setErrorMessage(response.message);
        // Expired or blocked: the password has to be typed again
        if (String(response.errorCode) !== "INVALID_INPUT") {
          setIsMfaStep(false);
        }
      })
      .finally(() => setIsCheckingCode(false));
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
    const loginMessage = loginMessageOf(queryParams);
    if (loginMessage) {
      setErrorMessage(loginMessage);
    }

    // Google sign-in of an account with a second factor
    if (queryParams.get("mfa") === "required") {
      setTrustedDeviceDays(Number(queryParams.get("trustedDeviceDays")) || 0);
      setIsMfaStep(true);
    }

    if (queryParams.has("redirectTo")) {
      const decodedRedirectTo = decodeURIComponent(
        queryParams.get("redirectTo") || "",
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
        src="./images/VariaMosLogo.webp"
        width={1200}
        height={245}
        alt="Variamos logo"
        className="img-fluid"
      />

      {isMfaStep ? (
        <MfaCodeForm
          onSubmitCode={onSubmitCode}
          onCancel={() => {
            setIsMfaStep(false);
            setErrorMessage(undefined);
          }}
          isLoading={isCheckingCode}
          trustedDeviceDays={trustedDeviceDays}
        />
      ) : (
        <LoginForm onSignIn={onSignIn} />
      )}

      <Alert
        className="w-100 m-0"
        variant="danger"
        show={!!errorMessage}
        dismissible
        onClose={() => setErrorMessage(undefined)}
      >
        {errorMessage}
      </Alert>

      {!isMfaStep && (
        <>
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
      )}
    </div>
  );
};
