import { type FC, useState } from "react";
import { Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ForgotPasswordForm } from "../../components/ForgotPasswordForm";
import { requestPasswordReset } from "../../api/AuthRepository";

export const ForgotPasswordPage: FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (email: string) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await requestPasswordReset(email);
      if (response.errorCode) {
        setError(response.message || "Error sending reset link. Please try again.");
      } else {
        setMessage(
          "If an account with this email exists, a password reset link has been sent. Please check your inbox!",
        );
      }
    } catch (error) {
      setError("Error sending reset link. Please try again.");
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
        <img src="./images/VariaMosLogo.png" alt="Variamos logo" className="img-fluid" />
        {message ? (
          <div className="w-100 text-center">
            <Alert variant="success" className="w-100 small mb-3">
              {message}
            </Alert>
            <Link to="/login" className="text-decoration-none text-primary-small">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="w-100 text-center">
              <h4 className="text-light mb-2">Forgot Password</h4>
              <p className="text-secondary small">
                Enter your email address to receive a temporary reset link.
              </p>
            </div>
            {error && (
              <Alert variant="danger" className="w-100 small">
                {error}
              </Alert>
            )}
            <ForgotPasswordForm onSubmitEmail={handleSubmit} isLoading={isLoading} />

            <div className="mt-2">
              <Link to="/login" className="text-decoration-none text-primary-small">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
};
