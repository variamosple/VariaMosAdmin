import { useSession } from "@variamosple/variamos-components";
import { FC, ReactNode, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { About } from "../Components/About";

export interface SignInLayoutProps {
  children: ReactNode;
}

export const SignInLayout: FC<SignInLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      const timeout = setTimeout(() => navigate("/"), 300);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isAuthenticated, navigate]);

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center p-0 h-100 "
    >
      <Row className="w-100 h-100 overflow-y-auto">
        <Col className="col-12 col-md-6 col-xl-5 order-1 order-md-2 d-flex justify-content-center align-items-center dark-75-container sticky-md-top vh-md-100 py-4 py-md-0">
          {children}
        </Col>
        <Col className="col-12 col-md-6 col-xl-7 order-2 order-md-1">
          <About />
        </Col>
      </Row>
    </Container>
  );
};
