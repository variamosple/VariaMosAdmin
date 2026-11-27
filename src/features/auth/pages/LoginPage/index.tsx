import { useRouter, useSession } from "@variamosple/variamos-components";
import { type FC, type ReactNode, useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import type { Credentials } from "@/features/user-management/domain/Entity/Credentials";
import { loginMessageOf } from "@/shared/api/errorMessages";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { pageLoader } from "@/shared/infrastructure/PageLoader";
import {
  offerDefaultCountry,
  registerRedirect,
} from "../../api/AuthRepository";
import { GoogleLogin } from "../../components/GoogleLogin";
import { LoginForm } from "../../components/LoginForm";
import { MfaCodeForm } from "../../components/MfaCodeForm";
import { safeRedirectOf } from "../../domain/Redirect";

// The sign-in steps: password, second factor, or guest
const useSignInSteps = () => {
  const { queryParams, navigate } = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [trustedDeviceDays, setTrustedDeviceDays] = useState(0);
  const { signIn, verifySecondFactor, signInAsGuest, isLoading } = useSession();
  // Back from a Google sign-in, only to be offered the country (EV-90)
  const isEndingGoogleSignIn = queryParams.get("signed-in") === "google";

  // Before leaving: the next page may be another application (EV-90)
  const leave = (redirect?: string) =>
    void offerDefaultCountry().then(() =>
      navigate(safeRedirectOf(redirect) || AppConfig.HOME_PAGE),
    );

  const onSignIn = (credentials: Credentials) => {
    void signIn(credentials).then((response) => {
      if (response.errorCode) {
        setErrorMessage(response.message);
      } else if (response.data?.mfaRequired) {
        // Right password, second factor on: the code is still expected
        setErrorMessage(undefined);
        setTrustedDeviceDays(response.data.trustedDeviceDays ?? 0);
        setIsMfaStep(true);
      } else {
        leave(response.data?.redirect);
      }
    });
  };

  // The session is open and loaded: no reload to read it
  const onSubmitCode = (code: string, rememberDevice: boolean) => {
    void verifySecondFactor(code, rememberDevice).then((response) => {
      if (!response.errorCode) {
        leave(response.data?.redirect);
        return;
      }
      setErrorMessage(response.message);
      // Expired or blocked: the password has to be typed again
      if (String(response.errorCode) !== "INVALID_INPUT") {
        setIsMfaStep(false);
      }
    });
  };

  const onSignInAsGuest = () => {
    void signInAsGuest().then((response) => {
      if (response.errorCode) {
        setErrorMessage(response.message);
      } else {
        navigate(
          safeRedirectOf(response.data?.redirect) || AppConfig.HOME_PAGE,
        );
      }
    });
  };

  useEffect(() => {
    const loginMessage = loginMessageOf(queryParams);
    if (loginMessage) {
      setErrorMessage(loginMessage);
    }

    // Google sign-in of an account without a country: signed in already,
    // back here to be offered the country of the browser, then home (EV-90).
    // Home only: the address names no page, so a link cannot send elsewhere
    if (isEndingGoogleSignIn) {
      void offerDefaultCountry().then(() =>
        pageLoader.load(AppConfig.HOME_PAGE),
      );
      return;
    }

    // Google sign-in of an account with a second factor
    if (queryParams.get("mfa") === "required") {
      setTrustedDeviceDays(Number(queryParams.get("trustedDeviceDays")) || 0);
      setIsMfaStep(true);
    }

    // Only a web address is kept as the page to go back to
    const redirectTo = safeRedirectOf(
      decodeURIComponent(queryParams.get("redirectTo") || ""),
    );
    if (redirectTo) {
      void registerRedirect(redirectTo).then();
    }
  }, [queryParams, isEndingGoogleSignIn]);

  return {
    errorMessage,
    setErrorMessage,
    isEndingGoogleSignIn,
    isMfaStep,
    setIsMfaStep,
    trustedDeviceDays,
    isLoading,
    onSignIn,
    onSubmitCode,
    onSignInAsGuest,
  };
};

interface OtherWaysProps {
  isLoading: boolean;
  onSignInAsGuest: () => void;
}

// Google, guest access and sign-up, offered beside the password
const OtherWays: FC<OtherWaysProps> = ({ isLoading, onSignInAsGuest }) => (
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
);

const SignInCard: FC<{ children: ReactNode }> = ({ children }) => (
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
    {children}
  </div>
);

export const LoginPage: FC = () => {
  usePageTitle("Sign in");
  const steps = useSignInSteps();
  const { errorMessage, setErrorMessage, isMfaStep } = steps;

  // Signed in by Google already: only the country is left to offer
  if (steps.isEndingGoogleSignIn) {
    return (
      <SignInCard>
        <output className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" aria-hidden="true" />
          Signing in…
        </output>
      </SignInCard>
    );
  }

  return (
    <SignInCard>
      {isMfaStep ? (
        <MfaCodeForm
          onSubmitCode={steps.onSubmitCode}
          onCancel={() => {
            steps.setIsMfaStep(false);
            setErrorMessage(undefined);
          }}
          isLoading={steps.isLoading}
          trustedDeviceDays={steps.trustedDeviceDays}
        />
      ) : (
        <LoginForm onSignIn={steps.onSignIn} />
      )}

      <Alert
        className="w-100 m-0"
        variant="danger"
        show={Boolean(errorMessage)}
        dismissible
        onClose={() => setErrorMessage(undefined)}
      >
        {errorMessage}
      </Alert>

      {!isMfaStep && (
        <OtherWays
          isLoading={steps.isLoading}
          onSignInAsGuest={steps.onSignInAsGuest}
        />
      )}
    </SignInCard>
  );
};
