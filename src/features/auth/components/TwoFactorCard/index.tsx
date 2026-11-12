import type { ResponseModel } from "@variamosple/variamos-components";
import { QRCodeSVG } from "qrcode.react";
import {
  type FC,
  type SubmitEvent,
  useCallback,
  useEffect,
  useId,
  useState,
} from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Spinner,
} from "react-bootstrap";
import { ErrorCodes } from "@/shared/api/errorCodes";
import {
  confirmMfaEnrollment,
  disableMfa,
  forgetTrustedDevices,
  getMfaStatus,
  startMfaEnrollment,
} from "../../api/MfaRepository";
import type { MfaEnrollment, MfaStatus } from "../../domain/Mfa";

/** Refused to a guest or without my-account rights: nothing to show. */
const isRefused = (errorCode?: number | string | null) =>
  errorCode === 403 || errorCode === ErrorCodes.FORBIDDEN;

type Load = "loading" | "ready" | "failed" | "refused";

// What the card says of the two-factor authentication of the account
const statusText = (status: MfaStatus | null, load: Load) => {
  if (status === null) {
    return load === "failed"
      ? "Two-factor authentication could not be loaded."
      : "Loading…";
  }
  if (!status.available) {
    return "Two-factor authentication is not available yet.";
  }
  return status.enabled
    ? `A code from your authenticator app is asked at sign-in. ${status.recoveryCodesRemaining} recovery code(s) left.`
    : "Ask for a code from an authenticator app at sign-in, on top of your password.";
};

type Step =
  | { name: "closed" }
  | { name: "password" }
  | { name: "scan"; enrollment: MfaEnrollment }
  | { name: "codes"; recoveryCodes: string[] }
  | { name: "disable" };

/** Saves the recovery codes as a text file. */
// The button that confirms the step: the password, the scan, or turning off
const submitLabelOf = (step: Step["name"]) => {
  if (step === "password") return "Continue";
  return step === "scan" ? "Turn on" : "Turn off";
};

const downloadCodes = (codes: string[]) => {
  const blob = new Blob(
    [`VariaMos recovery codes (each one works once)\n\n${codes.join("\n")}\n`],
    { type: "text/plain" },
  );
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "variamos-recovery-codes.txt";
  link.click();
  URL.revokeObjectURL(link.href);
};

// The two-factor state of the account, read again after each change
const useMfaStatus = () => {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [load, setLoad] = useState<Load>("loading");

  const refresh = useCallback(() => {
    void getMfaStatus().then((response) => {
      if (response.errorCode || !response.data) {
        setStatus(null);
        setLoad(isRefused(response.errorCode) ? "refused" : "failed");
        return;
      }
      setStatus(response.data);
      setLoad("ready");
    });
  }, []);

  const retry = () => {
    setLoad("loading");
    refresh();
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, load, refresh, retry };
};

// The dialog: its step, what is typed, and the request under way
const useMfaSteps = (refresh: () => void) => {
  const [step, setStep] = useState<Step>({ name: "closed" });
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const open = (next: Step) => {
    setPassword("");
    setCode("");
    setError(undefined);
    setStep(next);
  };

  const close = () => {
    open({ name: "closed" });
    refresh();
  };

  const run = <T,>(
    request: Promise<ResponseModel<T>>,
    onSuccess: (data: T | null | undefined) => void,
  ) => {
    setIsBusy(true);
    setError(undefined);
    void request
      .then((response) => {
        if (response.errorCode) {
          setError(response.message);
        } else {
          onSuccess(response.data);
        }
      })
      .finally(() => setIsBusy(false));
  };

  const onStart = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    run(startMfaEnrollment(password), (enrollment) => {
      if (enrollment) open({ name: "scan", enrollment });
    });
  };

  const onConfirm = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    run(confirmMfaEnrollment(code.trim()), (result) => {
      open({ name: "codes", recoveryCodes: result?.recoveryCodes ?? [] });
    });
  };

  const onDisable = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    run(disableMfa(password, code.trim()), () => close());
  };

  const fields = { password, setPassword, code, setCode };
  return {
    step,
    fields,
    error,
    isBusy,
    open,
    close,
    onStart,
    onConfirm,
    onDisable,
  };
};

type MfaSteps = ReturnType<typeof useMfaSteps>;

// Every browser that skips the code asks for it again
const useForgetBrowsers = () => {
  const [isForgetting, setIsForgetting] = useState(false);
  const [forgetMessage, setForgetMessage] = useState<string>();

  const forget = () => {
    setIsForgetting(true);
    void forgetTrustedDevices()
      .then((response) =>
        setForgetMessage(
          response.errorCode
            ? response.message || "Could not forget your browsers."
            : "Done: every browser will ask for the code again.",
        ),
      )
      .finally(() => setIsForgetting(false));
  };

  return { isForgetting, forgetMessage, forget };
};

interface MfaSummaryProps {
  mfa: ReturnType<typeof useMfaStatus>;
  steps: MfaSteps;
}

const MfaSummary: FC<MfaSummaryProps> = ({ mfa, steps }) => {
  const { status, load } = mfa;
  return (
    <div className="d-flex justify-content-between align-items-center gap-2">
      <div>
        <Card.Title className="mb-1">
          Two-factor authentication{" "}
          {status ? (
            <Badge bg={status.enabled ? "success" : "secondary"}>
              {status.enabled ? "On" : "Off"}
            </Badge>
          ) : null}
        </Card.Title>
        <Card.Text className="text-muted mb-0">
          {statusText(status, load)}
        </Card.Text>
      </div>
      {load === "failed" && (
        <Button variant="outline-secondary" size="sm" onClick={mfa.retry}>
          Try again
        </Button>
      )}
      {status?.available && status.enabled ? (
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => steps.open({ name: "disable" })}
        >
          Turn off
        </Button>
      ) : null}
      {status?.available && !status.enabled ? (
        <Button size="sm" onClick={() => steps.open({ name: "password" })}>
          Turn on
        </Button>
      ) : null}
    </div>
  );
};

const ForgetBrowsers: FC = () => {
  const { isForgetting, forgetMessage, forget } = useForgetBrowsers();
  return (
    <div className="mt-2 d-flex flex-wrap align-items-center gap-2">
      <Button
        variant="link"
        size="sm"
        className="p-0"
        onClick={forget}
        disabled={isForgetting}
      >
        Ask for the code again on all my browsers
      </Button>
      {forgetMessage ? (
        <span className="small text-muted" role="status">
          {forgetMessage}
        </span>
      ) : null}
    </div>
  );
};

interface StepProps {
  formId: string;
  steps: MfaSteps;
}

const PasswordStep: FC<StepProps> = ({ formId, steps }) => (
  <Form id={formId} onSubmit={steps.onStart}>
    <Form.Group controlId="mfa-password">
      <Form.Label>Confirm your password</Form.Label>
      <Form.Control
        type="password"
        autoComplete="current-password"
        value={steps.fields.password}
        onChange={(e) => steps.fields.setPassword(e.target.value)}
        required
      />
    </Form.Group>
  </Form>
);

const ScanStep: FC<StepProps & { enrollment: MfaEnrollment }> = ({
  formId,
  steps,
  enrollment,
}) => (
  <Form id={formId} onSubmit={steps.onConfirm}>
    <p>
      Scan this QR code with an authenticator app (Google Authenticator,
      Microsoft Authenticator, Aegis, 2FAS…), then type the code it shows.
    </p>
    <div className="d-flex justify-content-center bg-white p-3 mb-2">
      <QRCodeSVG
        value={enrollment.otpauthUri}
        size={192}
        title="QR code of the authenticator app"
      />
    </div>
    <p className="small text-muted text-break">
      Cannot scan it? Type this key in the app:{" "}
      <code data-testid="mfa-secret">{enrollment.secret}</code>
    </p>
    <Form.Group controlId="mfa-code">
      <Form.Label>Code from the app</Form.Label>
      <Form.Control
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={steps.fields.code}
        onChange={(e) => steps.fields.setCode(e.target.value)}
        required
      />
    </Form.Group>
  </Form>
);

const CodesStep: FC<{ recoveryCodes: string[] }> = ({ recoveryCodes }) => (
  <>
    <Alert variant="warning">
      Two-factor authentication is on. Save these recovery codes now: they will
      not be shown again. Each one lets you sign in once if you lose your phone.
    </Alert>
    <ul
      className="list-unstyled font-monospace row row-cols-2 mb-3"
      data-testid="recovery-codes"
    >
      {recoveryCodes.map((recoveryCode) => (
        <li key={recoveryCode} className="col">
          {recoveryCode}
        </li>
      ))}
    </ul>
    <Button
      variant="outline-primary"
      onClick={() => downloadCodes(recoveryCodes)}
    >
      Download
    </Button>
  </>
);

const DisableStep: FC<StepProps> = ({ formId, steps }) => (
  <Form id={formId} onSubmit={steps.onDisable}>
    <Form.Group controlId="mfa-disable-password" className="mb-2">
      <Form.Label>Password</Form.Label>
      <Form.Control
        type="password"
        autoComplete="current-password"
        value={steps.fields.password}
        onChange={(e) => steps.fields.setPassword(e.target.value)}
        required
      />
    </Form.Group>
    <Form.Group controlId="mfa-disable-code">
      <Form.Label>Code from the app, or a recovery code</Form.Label>
      <Form.Control
        autoComplete="one-time-code"
        maxLength={32}
        value={steps.fields.code}
        onChange={(e) => steps.fields.setCode(e.target.value)}
        required
      />
    </Form.Group>
  </Form>
);

const StepBody: FC<StepProps> = ({ formId, steps }) => {
  const { step } = steps;
  switch (step.name) {
    case "password":
      return <PasswordStep formId={formId} steps={steps} />;
    case "scan":
      return (
        <ScanStep formId={formId} steps={steps} enrollment={step.enrollment} />
      );
    case "codes":
      return <CodesStep recoveryCodes={step.recoveryCodes} />;
    case "disable":
      return <DisableStep formId={formId} steps={steps} />;
    default:
      return null;
  }
};

const StepButton: FC<StepProps> = ({ formId, steps }) => {
  const { step, isBusy } = steps;
  if (step.name === "codes") {
    return <Button onClick={steps.close}>I have saved them</Button>;
  }
  return (
    <Button
      type="submit"
      form={formId}
      variant={step.name === "disable" ? "danger" : "primary"}
      disabled={isBusy}
    >
      {isBusy ? (
        <Spinner animation="border" size="sm" />
      ) : (
        submitLabelOf(step.name)
      )}
    </Button>
  );
};

/**
 * Two-factor authentication of one's own account (SPC-2026-10-17-001):
 * turn it on with an authenticator app, keep the recovery codes, turn it
 * off with the password and a code.
 */
export const TwoFactorCard: FC = () => {
  const titleId = useId();
  const stepFormId = useId();
  const mfa = useMfaStatus();
  const steps = useMfaSteps(mfa.refresh);
  const { step } = steps;

  if (mfa.load === "refused") return null;

  return (
    <Card className="mt-3">
      <Card.Body>
        <MfaSummary mfa={mfa} steps={steps} />
        {mfa.status?.enabled ? <ForgetBrowsers /> : null}
      </Card.Body>

      <Modal
        aria-labelledby={titleId}
        show={step.name !== "closed"}
        onHide={step.name === "codes" ? undefined : steps.close}
        backdrop={step.name === "codes" ? "static" : true}
        centered
      >
        <Modal.Header closeButton={step.name !== "codes"}>
          <Modal.Title id={titleId}>Two-factor authentication</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <StepBody formId={stepFormId} steps={steps} />

          {steps.error ? (
            <Alert variant="danger" className="mt-3 mb-0">
              {steps.error}
            </Alert>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <StepButton formId={stepFormId} steps={steps} />
        </Modal.Footer>
      </Modal>
    </Card>
  );
};
