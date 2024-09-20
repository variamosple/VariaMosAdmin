import { FC, ReactNode } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useSession } from "../Context/SessionsContext";

export interface SignInLayoutProps {
  children: ReactNode;
}

export const SignInLayout: FC<SignInLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useSession();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate("/");
  }

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center p-0 h-100 dark-75-container"
    >
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

        {children}
      </div>
    </Container>
  );
};
