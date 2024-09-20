import { FC } from "react";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import { useSession } from "../Context/SessionsContext";

export const MainLayout: FC<unknown> = () => {
  const { logout } = useSession();
  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container fluid>
          <Navbar.Brand href="#">
            {/* <img
              src={VariaMosLogo}
              height="30"
              className="d-inline-block align-top"
              alt="React Bootstrap logo"
            /> */}
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
                title={"Guest"}
                className="me-5 pe-5"
                id="nav-dropdown"
              >
                {/* TODO: Add a Profile page */}
                <NavDropdown.Item>Report a problem</NavDropdown.Item>

                <NavDropdown.Divider />
                <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
              </NavDropdown>
            </Nav>
            <Nav />
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Outlet />

      <footer className="container-fluid">
        <div className="row copyright">
          <p>© Copyright 2023 VariaMos. Versión 4.24.04.19.09</p>
        </div>
      </footer>
    </>
  );
};
