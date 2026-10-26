import { withPageVisit } from "@variamosple/variamos-components";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { PersonalInformationUpdateForModal } from "@/features/user-management/components/UserInformationUpdateFormModal";
import type { PasswordUpdate } from "@/features/user-management/domain/Entity/PasswordUpdate";
import type { PersonalInformationUpdate } from "@/features/user-management/domain/Entity/PersonalInformationUpdate";
import type { User } from "@/features/user-management/domain/Entity/User";
import {
  LoadProblem,
  type LoadProblemKind,
  loadProblemOf,
} from "@/shared/components/LoadProblem";
import { useToast } from "@/shared/context/ToastContext";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import {
  getMyAccount,
  updatePersonalInformation,
  updateUserPassword,
} from "../api/AuthRepository";
import { PasswordUpdateForm } from "../components/PasswordUpdateForm";
import { TwoFactorCard } from "../components/TwoFactorCard";

const MyAccountPageComponent: FC = () => {
  usePageTitle("My account");
  const [user, setUser] = useState<User>();
  const [problem, setProblem] = useState<LoadProblemKind | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [showInformationUpdate, setShowInformationUpdate] = useState(false);
  const [isUpdatingInformation, setIsUpdatingInformation] = useState(false);
  const { pushToast } = useToast();

  const personalInformation: PersonalInformationUpdate = useMemo(
    () => ({ countryCode: user?.countryCode }),
    [user],
  );

  const queryUser = useCallback(() => {
    setIsLoading(true);
    getMyAccount()
      .then((response) => {
        setProblem(loadProblemOf(response));
        setUser(response.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    queryUser();
  }, [queryUser]);

  const onPasswordUpdate = (passwordUpdate: PasswordUpdate) => {
    setIsUpdatingPassword(true);
    return updateUserPassword(passwordUpdate)
      .then((response) => {
        if (!response.errorCode) {
          setShowPasswordUpdate(false);
          pushToast({
            title: "Password updated",
            message: "Your password has been changed.",
            variant: "success",
          });
        }

        return response;
      })
      .finally(() => {
        setIsUpdatingPassword(false);
      });
  };

  const onPersonalInformationUpdate = (
    information: PersonalInformationUpdate,
  ) => {
    setIsUpdatingInformation(true);
    return updatePersonalInformation(information)
      .then((response) => {
        if (!response.errorCode) {
          setShowInformationUpdate(false);
          pushToast({
            title: "Information updated",
            message: "Your information has been saved.",
            variant: "success",
          });
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
          <Spinner
            data-testid="loading-spinner"
            animation="border"
            variant="primary"
          />
        </div>
      </Container>
    );
  }

  // A failed read shows its message, not empty fields (UX-24)
  if (problem) {
    return (
      <Container fluid="sm" className="my-2">
        <h1>My account</h1>
        <hr />
        <LoadProblem problem={problem} item="account" onRetry={queryUser} />
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

      <TwoFactorCard />

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
