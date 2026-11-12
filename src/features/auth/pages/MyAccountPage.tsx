import {
  type ResponseModel,
  withPageVisit,
} from "@variamosple/variamos-components";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { PersonalInformationUpdateForModal } from "@/features/auth/components/UserInformationUpdateFormModal";
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
import { TimeZoneSetting } from "../components/TimeZoneSetting";
import { TwoFactorCard } from "../components/TwoFactorCard";

// The signed-in account, read again after a change or on a retry
const useMyAccount = () => {
  const [user, setUser] = useState<User>();
  const [problem, setProblem] = useState<LoadProblemKind | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const queryUser = useCallback(() => {
    setIsLoading(true);
    void getMyAccount()
      .then((response) => {
        setProblem(loadProblemOf(response));
        setUser(response.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    queryUser();
  }, [queryUser]);

  return { user, problem, isLoading, queryUser };
};

// A form in a modal: shown, saving, and closed with a toast once saved
const useAccountChange = <Input, Output>(
  request: (input: Input) => Promise<ResponseModel<Output>>,
  saved: { title: string; message: string },
  onSaved?: () => void,
) => {
  const [show, setShow] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { pushToast } = useToast();

  const submit = (input: Input) => {
    setIsSaving(true);
    return request(input)
      .then((response) => {
        if (!response.errorCode) {
          setShow(false);
          pushToast({ ...saved, variant: "success" });
          onSaved?.();
        }

        return response;
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return { show, setShow, isSaving, submit };
};

const LoadingPage: FC = () => (
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

interface AccountFieldsProps {
  user?: User;
  onPasswordUpdate: () => void;
}

const AccountFields: FC<AccountFieldsProps> = ({ user, onPasswordUpdate }) => (
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
      <TimeZoneSetting countryCode={user?.countryCode} />
    </Col>

    <Col className="col-12 col-md-6">
      <span className="fw-bold">Password: </span>{" "}
      <span className="text-muted">********</span>
      <Button
        className="ms-1"
        variant="primary"
        size="sm"
        onClick={onPasswordUpdate}
      >
        Update
      </Button>
    </Col>
  </Row>
);

const MyAccountPageComponent: FC = () => {
  usePageTitle("My account");
  const { user, problem, isLoading, queryUser } = useMyAccount();
  const password = useAccountChange<PasswordUpdate, void>(updateUserPassword, {
    title: "Password updated",
    message: "Your password has been changed.",
  });
  const information = useAccountChange<PersonalInformationUpdate, void>(
    updatePersonalInformation,
    {
      title: "Information updated",
      message: "Your information has been saved.",
    },
    queryUser,
  );

  const personalInformation: PersonalInformationUpdate = useMemo(
    () => ({ countryCode: user?.countryCode }),
    [user],
  );

  if (isLoading) return <LoadingPage />;

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
          <Button onClick={() => information.setShow(true)}>
            Edit information
          </Button>
        </div>
      </div>

      <hr />

      <AccountFields
        user={user}
        onPasswordUpdate={() => password.setShow(true)}
      />

      <TwoFactorCard />

      <PasswordUpdateForm
        showModal={password.show}
        onClose={() => password.setShow(false)}
        onUpdatePasswordSubmit={password.submit}
        isLoading={password.isSaving}
      />

      <PersonalInformationUpdateForModal
        showModal={information.show}
        onClose={() => information.setShow(false)}
        onUpdatePersonalInformationSubmit={information.submit}
        defaultValue={personalInformation}
        isLoading={information.isSaving}
      />
    </Container>
  );
};

export const MyAccountPage = withPageVisit(MyAccountPageComponent, "MyAccount");
