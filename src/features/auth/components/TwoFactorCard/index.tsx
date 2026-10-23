import type { ResponseModel } from "@variamosple/variamos-components";
import { QRCodeSVG } from "qrcode.react";
import { type FC, useCallback, useEffect, useState } from "react";
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

type Step =
  | { name: "closed" }
  | { name: "password" }
  | { name: "scan"; enrollment: MfaEnrollment }
  | { name: "codes"; recoveryCodes: string[] }
  | { name: "disable" };

/** Saves the recovery codes as a text file. */
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

/**
 * Two-factor authentication of one's own account (SPC-2026-10-17-001):
 * turn it on with an authenticator app, keep the recovery codes, turn it
 * off with the password and a code.
 */
export const TwoFactorCard: FC = () => {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [load, setLoad] = useState<Load>("loading");
  const [step, setStep] = useState<Step>({ name: "closed" });
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const [isForgetting, setIsForgetting] = useState(false);
  const [forgetMessage, setForgetMessage] = useState<string>();

  const refresh = useCallback(() => {
    getMfaStatus().then((response) => {
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
    request
      .then((response) => {
        if (response.errorCode) {
          setError(response.message);
        } else {
          onSuccess(response.data);
        }
      })
      .finally(() => setIsBusy(false));
  };

  const onStart = (event: React.FormEvent) => {
    event.preventDefault();
    run(startMfaEnrollment(password), (enrollment) => {
      if (enrollment) open({ name: "scan", enrollment });
    });
  };

  const onConfirm = (event: React.FormEvent) => {
    event.preventDefault();
    run(confirmMfaEnrollment(code.trim()), (result) => {
      open({ name: "codes", recoveryCodes: result?.recoveryCodes ?? [] });
    });
  };

  const onDisable = (event: React.FormEvent) => {
    event.preventDefault();
    run(disableMfa(password, code.trim()), () => close());
  };

  const onForgetBrowsers = () => {
    setIsForgetting(true);
    forgetTrustedDevices()
      .then((response) =>
        setForgetMessage(
          response.errorCode
            ? response.message || "Could not forget your browsers."
            : "Done: every browser will ask for the code again.",
        ),
      )
      .finally(() => setIsForgetting(false));
  };

  if (load === "refused") return null;

  return (
    <Card className="mt-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div>
            <Card.Title className="mb-1">
              Two-factor authentication{" "}
              {status &&
                (status.enabled ? (
                  <Badge bg="success">On</Badge>
                ) : (
                  <Badge bg="secondary">Off</Badge>
                ))}
            </Card.Title>
            <Card.Text className="text-muted mb-0">
              {status === null
                ? load === "failed"
                  ? "Two-factor authentication could not be loaded."
                  : "Loading…"
                : !status.available
                  ? "Two-factor authentication is not available yet."
                  : status.enabled
                    ? `A code from your authenticator app is asked at sign-in. ${status.recoveryCodesRemaining} recovery code(s) left.`
                    : "Ask for a code from an authenticator app at sign-in, on top of your password."}
            </Card.Text>
          </div>
          {load === "failed" && (
            <Button variant="outline-secondary" size="sm" onClick={retry}>
              Try again
            </Button>
          )}
          {status?.available &&
            (status.enabled ? (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => open({ name: "disable" })}
              >
                Turn off
              </Button>
            ) : (
              <Button size="sm" onClick={() => open({ name: "password" })}>
                Turn on
              </Button>
            ))}
        </div>
        {status?.enabled && (
          <div className="mt-2 d-flex flex-wrap align-items-center gap-2">
            <Button
              variant="link"
              size="sm"
              className="p-0"
              onClick={onForgetBrowsers}
              disabled={isForgetting}
            >
              Ask for the code again on all my browsers
            </Button>
            {forgetMessage && (
              <span className="small text-muted" role="status">
                {forgetMessage}
              </span>
            )}
          </div>
        )}
      </Card.Body>

      <Modal
        show={step.name !== "closed"}
        onHide={step.name === "codes" ? undefined : close}
        backdrop={step.name === "codes" ? "static" : true}
        centered
      >
        <Modal.Header closeButton={step.name !== "codes"}>
          <Modal.Title>Two-factor authentication</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {step.name === "password" && (
            <Form id="mfa-step-form" onSubmit={onStart}>
              <Form.Group controlId="mfa-password">
                <Form.Label>Confirm your password</Form.Label>
                <Form.Control
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
            </Form>
          )}

          {step.name === "scan" && (
            <Form id="mfa-step-form" onSubmit={onConfirm}>
              <p>
                Scan this QR code with an authenticator app (Google
                Authenticator, Microsoft Authenticator, Aegis, 2FAS…), then type
                the code it shows.
              </p>
              <div className="d-flex justify-content-center bg-white p-3 mb-2">
                <QRCodeSVG
                  value={step.enrollment.otpauthUri}
                  size={192}
                  title="QR code of the authenticator app"
                />
              </div>
              <p className="small text-muted text-break">
                Cannot scan it? Type this key in the app:{" "}
                <code data-testid="mfa-secret">{step.enrollment.secret}</code>
              </p>
              <Form.Group controlId="mfa-code">
                <Form.Label>Code from the app</Form.Label>
                <Form.Control
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </Form.Group>
            </Form>
          )}

          {step.name === "codes" && (
            <>
              <Alert variant="warning">
                Two-factor authentication is on. Save these recovery codes now:
                they will not be shown again. Each one lets you sign in once if
                you lose your phone.
              </Alert>
              <ul
                className="list-unstyled font-monospace row row-cols-2 mb-3"
                data-testid="recovery-codes"
              >
                {step.recoveryCodes.map((recoveryCode) => (
                  <li key={recoveryCode} className="col">
                    {recoveryCode}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline-primary"
                onClick={() => downloadCodes(step.recoveryCodes)}
              >
                Download
              </Button>
            </>
          )}

          {step.name === "disable" && (
            <Form id="mfa-step-form" onSubmit={onDisable}>
              <Form.Group controlId="mfa-disable-password" className="mb-2">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group controlId="mfa-disable-code">
                <Form.Label>Code from the app, or a recovery code</Form.Label>
                <Form.Control
                  autoComplete="one-time-code"
                  maxLength={32}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </Form.Group>
            </Form>
          )}

          {error && (
            <Alert variant="danger" className="mt-3 mb-0">
              {error}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          {step.name === "codes" ? (
            <Button onClick={close}>I have saved them</Button>
          ) : (
            <Button
              type="submit"
              form="mfa-step-form"
              variant={step.name === "disable" ? "danger" : "primary"}
              disabled={isBusy}
            >
              {isBusy ? (
                <Spinner animation="border" size="sm" />
              ) : step.name === "password" ? (
                "Continue"
              ) : step.name === "scan" ? (
                "Turn on"
              ) : (
                "Turn off"
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Card>
  );
};
