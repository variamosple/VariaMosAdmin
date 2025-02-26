import { useSession } from "@/UI/Context/SessionsContext";
import React, { ReactNode } from "react";
import { Container, Spinner } from "react-bootstrap";
import { Navigate } from "react-router-dom";

interface AuthWrapperProps {
  // Roles or permissions required to access this route
  requiredRoles?: string[];
  // Redirect path if not authenticated or authorized
  redirectPath?: string;
  children: ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({
  requiredRoles = [],
  redirectPath = "/login",
  children,
}) => {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <Container fluid="sm" className="my-2">
        <div className="w-100 text-center my-3">
          <Spinner animation="border" variant="primary" />
        </div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} />;
  }

  //   if (requiredRoles.length > 0 && !user?.roles?.some((role: string) => requiredRoles.includes(role))) {
  //     return <Navigate to="/unauthorized" />;
  //   }

  // Render the nested routes if authenticated and authorized
  return <>{children}</>;
};

export default AuthWrapper;
