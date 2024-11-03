import { useSession } from "@/UI/Context/SessionsContext";
import { FC } from "react";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Menu } from "../Menu";

export const Header: FC<unknown> = () => {
  const { user, logout } = useSession();
  const navigate = useNavigate();

  return (
    <header className="sticky-top">
      <Navbar bg="dark" variant="dark">
        <Container fluid>
          <Navbar.Brand href="#">
            <img
              src="./images/VariaMosLogo.png"
              height="30"
              className="d-inline-block align-top"
              alt="React Bootstrap logo"
            />
          </Navbar.Brand>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="https://variamos.com/home/" target="_blank">
                Home
              </Nav.Link>
              <Nav.Link
                href="https://github.com/variamosple/VariaMosPLE/wiki"
                target="_blank"
              >
                Wiki
              </Nav.Link>
            </Nav>
            <Nav>
              <NavDropdown
                title={user?.name}
                className="me-5 pe-5"
                id="nav-dropdown"
              >
                <NavDropdown.Item onClick={() => navigate("/my-account")}>
                  My account
                </NavDropdown.Item>

                <NavDropdown.Item>Report a problem</NavDropdown.Item>

                <NavDropdown.Divider />
                <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
              </NavDropdown>
            </Nav>
            <Nav />
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Menu />
    </header>
  );
};
