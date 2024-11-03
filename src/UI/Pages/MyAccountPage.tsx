import {
  getMyAccount,
  updateUserPassword,
} from "@/DataProviders/AuthRepository";
import { PasswordUpdate } from "@/Domain/User/Entity/PasswordUpdate";
import { User } from "@/Domain/User/Entity/User";
import { FC, useEffect, useState } from "react";
import { Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { PasswordUpdateForm } from "../Components/PasswordUpdateForm";

export const MyAccountPage: FC<unknown> = () => {
  const [user, setUser] = useState<User>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const queryUser = () => {
    setIsLoading(true);
    getMyAccount()
      .then((response) => {
        setUser(response.data);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    queryUser();
  }, []);

  const onPasswordUpdate = (passwordUpdate: PasswordUpdate) => {
    setIsUpdatingPassword(true);
    return updateUserPassword(passwordUpdate)
      .then((response) => {
        if (!response.errorCode) {
          setShowPasswordUpdate(false);
        }

        return response;
      })
      .finally(() => {
        setIsUpdatingPassword(false);
      });
  };

  if (isLoading) {
    return (
      <Container fluid="sm" className="my-2">
        <div className="w-100 text-center my-3">
          <Spinner animation="border" variant="primary" />
        </div>
      </Container>
    );
  }

  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">My account</h1>

      <hr />

      <Row className="w-100">
        <Col className="col-12 col-md-6">
          <span className="fw-bold">Name: </span> {user?.name}
        </Col>

        <Col className="col-12 col-md-6">
          <span className="fw-bold">User: </span> {user?.user}
        </Col>

        <Col className="col-12 col-md-6">
          <span className="fw-bold">Email: </span> {user?.email}
        </Col>

        <Col className="col-12 col-md-6">
          <span className="fw-bold">Password: </span>{" "}
          <span className="text-muted">********</span>
          <Button
            className="ms-1"
            variant="primary"
            size="sm"
            onClick={() => setShowPasswordUpdate(true)}
          >
            Update
          </Button>
        </Col>
      </Row>

      <PasswordUpdateForm
        showModal={showPasswordUpdate}
        onClose={() => setShowPasswordUpdate(false)}
        onUpdatePasswordSubmit={onPasswordUpdate}
        isLoading={isUpdatingPassword}
      />
    </Container>
  );
};
