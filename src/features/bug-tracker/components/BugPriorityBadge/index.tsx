import type { FC } from "react";
import { Badge } from "react-bootstrap";
import { ExclamationOctagonFill } from "react-bootstrap-icons";
import {
  BUG_PRIORITY_LABELS,
  type BugPriority,
} from "../../domain/BugPriority";

const STYLES: Record<BugPriority, { bg: string; text?: "dark" }> = {
  low: { bg: "info", text: "dark" },
  medium: { bg: "warning", text: "dark" },
  high: { bg: "danger" },
  critical: { bg: "danger" },
};

export const BugPriorityBadge: FC<{ priority?: string }> = ({ priority }) => {
  const known = priority?.toLowerCase() as BugPriority | undefined;
  if (!known || !(known in STYLES)) {
    return <Badge bg="secondary">{priority || "None"}</Badge>;
  }
  const { bg, text } = STYLES[known];
  return (
    <Badge bg={bg} text={text}>
      {known === "critical" && (
        <ExclamationOctagonFill className="me-1" aria-hidden="true" />
      )}
      {BUG_PRIORITY_LABELS[known]}
    </Badge>
  );
};
