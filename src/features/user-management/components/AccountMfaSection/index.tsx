import { useSession } from "@variamosple/variamos-components";
import { type FC, useCallback, useEffect, useState } from "react";
import { Badge, Button, Spinner } from "react-bootstrap";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { useToast } from "@/shared/context/ToastContext";
import {
  getAccountMfaStatus,
  resetAccountMfa,
} from "../../api/AccountMfaRepository";
import type { AccountMfaStatus } from "../../domain/Entity/AccountMfa";

export const RESET_MFA_PERMISSION = "users::reset-mfa";

const TITLE = "Two-factor authentication";

export interface AccountMfaSectionProps {
  userId: string;
}

/**
 * Second factor of another account (SPC-2026-10-17-001, lot 4): shown to
 * administrators who may turn it off when its owner lost their phone and
 * recovery codes. Hidden on one's own account, which turns it off from
 * "My account" with a code.
 */
export const AccountMfaSection: FC<AccountMfaSectionProps> = ({ userId }) => {
  const { user: operator } = useSession();
  const { pushToast } = useToast();
  const [status, setStatus] = useState<AccountMfaStatus | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const canReset =
    !!operator?.permissions?.includes(RESET_MFA_PERMISSION) &&
    operator.id !== userId;

  const refresh = useCallback(() => {
    getAccountMfaStatus(userId).then((response) => {
      setStatus(response.errorCode ? null : (response.data ?? null));
    });
  }, [userId]);

  useEffect(() => {
    if (canReset) refresh();
  }, [canReset, refresh]);

  if (!canReset || status === null) return null;

  const onConfirm = () => {
    setShowConfirm(false);
    setIsBusy(true);
    resetAccountMfa(userId)
      .then((response) => {
        if (response.errorCode) {
          pushToast({
            title: TITLE,
            message:
              response.message ||
              "Could not turn off the two-factor authentication.",
            variant: "danger",
          });
          return;
        }
        pushToast({
          title: TITLE,
          message: response.data?.emailSent
            ? "Turned off. The user was told by e-mail."
            : "Turned off, but the user could not be told by e-mail.",
          variant: response.data?.emailSent ? "success" : "warning",
        });
      })
      .finally(() => {
        setIsBusy(false);
        refresh();
      });
  };

  return (
    <section className="mt-3" aria-label={TITLE}>
      <h2>
        {TITLE}{" "}
        {status.enabled ? (
          <Badge bg="success">On</Badge>
        ) : (
          <Badge bg="secondary">Off</Badge>
        )}
      </h2>

      <hr />

      {status.enabled ? (
        <>
          <p className="text-muted">
            Turn it off only when the user lost both their authenticator app and
            their recovery codes. They will sign in with their password alone
            and can turn it on again.
          </p>
          <Button
            variant="outline-danger"
            disabled={isBusy}
            onClick={() => setShowConfirm(true)}
          >
            {isBusy ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Turn off two-factor authentication"
            )}
          </Button>
        </>
      ) : (
        <p className="text-muted mb-0">This user has not turned it on.</p>
      )}

      <ConfirmationModal
        show={showConfirm}
        title="Turn off two-factor authentication"
        message="Turn off two-factor authentication for this user? The user will be told by e-mail."
        confirmLabel="Turn off"
        confirmButtonVariant="danger"
        onConfirm={onConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </section>
  );
};
