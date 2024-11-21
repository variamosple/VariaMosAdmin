import { FC } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export const Menu: FC<unknown> = () => {
  const navigate = useNavigate();

  const navigateTo = (route: string) => () => {
    navigate(route);
  };

  return (
    <Navbar className="py-1 shadow-sm bg-white">
      <Container>
        <Navbar.Collapse>
          <Nav className="d-flex justify-content-center w-100 gap-3">
            <Nav.Link className="p-0" onClick={navigateTo("/users")}>
              Users
            </Nav.Link>
            <Nav.Link className="p-0" onClick={navigateTo("/roles")}>
              Roles
            </Nav.Link>
            <Nav.Link className="p-0" onClick={navigateTo("/permissions")}>
              Permission
            </Nav.Link>
            <Nav.Link className="p-0" onClick={navigateTo("/metrics")}>
              Metrics
            </Nav.Link>
            <Nav.Link className="p-0" onClick={navigateTo("/monitoring")}>
              Monitoring
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
