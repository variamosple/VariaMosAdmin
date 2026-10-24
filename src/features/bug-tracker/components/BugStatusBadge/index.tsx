import type { FC } from "react";
import { Badge } from "react-bootstrap";
import { statusLabel } from "../../domain/BugStatus";

const VARIANTS: Record<string, { bg: string; text?: "dark" | "white" }> = {
  pending: { bg: "light", text: "dark" },
  open: { bg: "success" },
  in_progress: { bg: "primary" },
  resolved: { bg: "info", text: "dark" },
  closed: { bg: "secondary" },
  rejected: { bg: "danger" },
  purged: { bg: "dark" },
};

export const BugStatusBadge: FC<{ status?: string }> = ({ status }) => {
  const variant = (status && VARIANTS[status]) || {
    bg: "light",
    text: "dark" as const,
  };
  return (
    <Badge bg={variant.bg} text={variant.text}>
      {statusLabel(status)}
    </Badge>
  );
};
