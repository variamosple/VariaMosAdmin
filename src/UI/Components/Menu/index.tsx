import { FC, useState } from "react";
import { Button, Nav, Offcanvas } from "react-bootstrap";
import { List } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

export const Menu: FC<unknown> = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const navigateAndClose = (route: string) => () => {
    navigate(route);
    handleClose();
  };

  return (
    <>
      <Button variant="dark" size="lg" onClick={handleShow} className="me-3">
        <List />
      </Button>

      <Offcanvas show={show} onHide={handleClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <Nav className="justify-content-end flex-grow-1 pe-3">
            <Nav.Link onClick={navigateAndClose("/users")}>Users</Nav.Link>
            <Nav.Link onClick={navigateAndClose("/roles")}>Roles</Nav.Link>
            <Nav.Link onClick={navigateAndClose("/permissions")}>
              Permission
            </Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};
