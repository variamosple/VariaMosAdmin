import { useRouter, useSession } from "@variamosple/variamos-components";
import { type FC, useEffect, useState } from "react";
import { Alert, Button, Container } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { getMfaStatus } from "../../api/MfaRepository";

/** How long a closed invitation stays hidden. */
export const INVITATION_PAUSE_MS = 7 * 24 * 60 * 60 * 1000;

const storageKey = (userId: string) => `mfaInvitationClosedAt:${userId}`;

/**
 * Accounts that manage others (SPC-2026-10-17-001, section 4): any users,
 * roles or permissions right, or changing the configuration.
 */
export const managesOthers = (permissions: readonly string[] = []) =>
  permissions.some(
    (permission) =>
      permission.startsWith("users::") ||
      permission.startsWith("roles::") ||
      permission.startsWith("permissions::") ||
      permission === "configurations::update",
  );

// The browser may refuse its storage: the invitation then shows each time
const closedRecently = (userId: string, now: number) => {
  try {
    const closedAt = Number(localStorage.getItem(storageKey(userId)));
    return closedAt > 0 && now - closedAt < INVITATION_PAUSE_MS;
  } catch {
    return false;
  }
};

const rememberClosed = (userId: string, now: number) => {
  try {
    localStorage.setItem(storageKey(userId), String(now));
  } catch {
    // Shown again at the next page load
  }
};

/**
 * Invites accounts that manage others to turn on two-factor authentication.
 * It never blocks anything: two-factor authentication stays optional.
 */
export const MfaInvitationBanner: FC = () => {
  const { user } = useSession();
  const { navigate } = useRouter();
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  const userId = user?.id;
  const invited = !!userId && managesOthers(user?.permissions);

  // Read again on each page, so that the banner goes once the factor is on
  useEffect(() => {
    if (!invited || !userId || pathname === "/my-account") {
      setShow(false);
      return;
    }
    if (closedRecently(userId, Date.now())) return;
    let current = true;
    getMfaStatus().then((response) => {
      if (current) {
        setShow(
          !response.errorCode &&
            !!response.data?.available &&
            !response.data.enabled,
        );
      }
    });
    return () => {
      current = false;
    };
  }, [invited, userId, pathname]);

  if (!show || !userId) return null;

  const close = () => {
    rememberClosed(userId, Date.now());
    setShow(false);
  };

  return (
    <Container fluid="sm" className="mt-2">
      <Alert
        variant="info"
        dismissible
        onClose={close}
        className="d-flex flex-wrap align-items-center gap-2 mb-0"
      >
        <span className="me-auto">
          <strong>Protect your account:</strong> turn on two-factor
          authentication. You manage other accounts, so a stolen password should
          not be enough to sign in as you.
        </span>
        <Button size="sm" onClick={() => navigate("/my-account")}>
          Turn it on
        </Button>
      </Alert>
    </Container>
  );
};
