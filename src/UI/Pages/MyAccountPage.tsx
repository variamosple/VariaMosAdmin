import {
  getMyAccount,
  updatePersonalInformation,
  updateUserPassword,
} from "@/DataProviders/AuthRepository";
import { PasswordUpdate } from "@/Domain/User/Entity/PasswordUpdate";
import { PersonalInformationUpdate } from "@/Domain/User/Entity/PersonalInformationUpdate";
import { User } from "@/Domain/User/Entity/User";
import { withPageVisit } from "@variamosple/variamos-components";
import { FC, useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { PasswordUpdateForm } from "../Components/PasswordUpdateForm";
import { PersonalInformationUpdateForModal } from "../Components/UserInformationUpdateFormModal";

const MyAccountPageComponent: FC<unknown> = () => {
  const [user, setUser] = useState<User>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [showInformationUpdate, setShowInformationUpdate] = useState(false);
  const [isUpdatingInformation, setIsUpdatingInformation] = useState(false);

  const personalInformation: PersonalInformationUpdate = useMemo(
    () => ({ countryCode: user?.countryCode }),
    [user]
  );

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

  const onPersonalInformationUpdate = (
    information: PersonalInformationUpdate
  ) => {
    setIsUpdatingInformation(true);
    return updatePersonalInformation(information)
      .then((response) => {
        if (!response.errorCode) {
          setShowInformationUpdate(false);
          queryUser();
        }

        return response;
      })
      .finally(() => {
        setIsUpdatingInformation(false);
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
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">My account</h1>

        <div>
          <Button onClick={() => setShowInformationUpdate(true)}>
            Edit information
          </Button>
        </div>
      </div>

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
          <span className="fw-bold">Country: </span> {user?.countryName}
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

      <PersonalInformationUpdateForModal
        showModal={showInformationUpdate}
        onClose={() => setShowInformationUpdate(false)}
        onUpdatePersonalInformationSubmit={onPersonalInformationUpdate}
        defaultValue={personalInformation}
        isLoading={isUpdatingInformation}
      />
    </Container>
  );
};

export const MyAccountPage = withPageVisit(MyAccountPageComponent, "MyAccount");
