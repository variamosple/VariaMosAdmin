import { type FC, useState, useEffect } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { ResetPasswordForm } from "@/UI/Components/ResetPasswordForm";
import { ADMIN_CLIENT } from "@/Infrastructure/AxiosConfig";

export const ResetPasswordPage: FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(true);
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setIsVerifyingToken(false);
        return;
      }

      try {
        await ADMIN_CLIENT.get(`/auth/verify-token?token=${token}`);
        setIsTokenValid(true);
      } catch (err) {
        setIsTokenValid(false);
      } finally {
        setIsVerifyingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (password: string) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await ADMIN_CLIENT.post("/auth/reset-password", { token, password });
      setMessage("Your password has been reset successfully !");
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || "";
      if (
        serverMessage.includes(
          "New password cannot be the same as the old password",
        )
      ) {
        setError("New password must be different from the current one.");
      } else {
        setError("Error modifying password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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

        <div className="w-100 text-center">
          <h4 className="text-light mb-2">Reset Password</h4>
        </div>

        {isVerifyingToken ? (
          <div className="text-center my-3">
            <Spinner animation="border" variant="light" size="sm" />
            <p className="text-secondary small mt-2">
              Checking link validity...
            </p>
          </div>
        ) : !isTokenValid ? (
          <div className="w-100 text-center">
            <Alert variant="danger" className="w-100 small mb-3">
              This password reset link is invalid, has expired, or has already
              been used.
            </Alert>
            <Link
              to="/forgot-password"
              className="text-decoration-none text-primary-small"
            >
              Request a new link
            </Link>
          </div>
        ) : message ? (
          <div className="w-100 text-center">
            <Alert variant="success" className="w-100 small mb-3">
              {message}
            </Alert>
            <Link
              to="/login"
              className="text-decoration-none text-primary-small"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="w-100 text-center">
              <p className="text-secondary small">
                Enter your new password to reset your account credentials.
              </p>
            </div>
            {error && (
              <Alert variant="danger" className="w-100 small">
                {error}
              </Alert>
            )}
            <ResetPasswordForm
              onSubmitPassword={handleSubmit}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </>
  );
};
