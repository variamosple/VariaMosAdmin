import type { ResponseModel } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Alert, Button } from "react-bootstrap";
import { ErrorCodes, isErrorCode } from "@/shared/api/errorCodes";
import { SYSTEM_ERROR_MESSAGE } from "@/shared/api/errorMessages";

/** Why a detail page has nothing to show: the item is missing, or the read failed. */
export type LoadProblemKind = { notFound: true } | { message: string };

/**
 * The problem of a read, or null when it brought the item. A missing item
 * comes back as ENTITY_NOT_FOUND, as a 404, or as a success without data.
 */
export const loadProblemOf = <T,>(
  response: ResponseModel<T>,
): LoadProblemKind | null => {
  const code = response.errorCode as number | string | null | undefined;
  if (isErrorCode(code, ErrorCodes.ENTITY_NOT_FOUND) || code === 404) {
    return { notFound: true };
  }
  if (code) return { message: response.message || SYSTEM_ERROR_MESSAGE };
  return response.data ? null : { notFound: true };
};

export interface LoadProblemProps {
  problem: LoadProblemKind;
  // Singular noun of the item: "user", "role"
  item: string;
  onRetry: () => void;
}

/** In place of a detail page that could not load its item (UX-24). */
export const LoadProblem: FC<LoadProblemProps> = ({
  problem,
  item,
  onRetry,
}) =>
  "notFound" in problem ? (
    <Alert variant="warning">
      This {item} does not exist, or it was deleted.
    </Alert>
  ) : (
    <Alert variant="danger" className="d-flex align-items-center gap-2">
      <span>{problem.message}</span>
      <Button
        size="sm"
        variant="outline-danger"
        className="ms-auto"
        onClick={onRetry}
      >
        Retry
      </Button>
    </Alert>
  );
