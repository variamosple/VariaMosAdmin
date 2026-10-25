import type { FC, ReactNode } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import type { ListState } from "@/shared/hooks/usePagedList";

export interface TableStateRowProps {
  state: ListState;
  isEmpty: boolean;
  colSpan: number;
  // Plural noun of the items: "users", "roles"
  items: string;
}

/**
 * The row a list table shows instead of its items: the failed load with a
 * Retry button, the first load, or an empty list, which reads differently
 * with a search (UX-23). Nothing once there are items to show.
 */
export const TableStateRow: FC<TableStateRowProps> = ({
  state,
  isEmpty,
  colSpan,
  items,
}) => {
  let content: ReactNode = null;

  if (state.error) {
    content = (
      <Alert variant="danger" className="m-0 d-flex align-items-center gap-2">
        <span>{state.error}</span>
        <Button
          size="sm"
          variant="outline-danger"
          className="ms-auto"
          onClick={state.onRetry}
        >
          Retry
        </Button>
      </Alert>
    );
  } else if (isEmpty && state.isLoading) {
    content = (
      <span className="text-muted d-inline-flex align-items-center gap-2">
        <Spinner animation="border" size="sm" /> Loading {items}...
      </span>
    );
  } else if (isEmpty) {
    content = (
      <span className="text-muted">
        {state.isFiltered
          ? `No ${items} match the search.`
          : `No ${items} yet.`}
      </span>
    );
  }

  if (!content) return null;
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-3">
        {content}
      </td>
    </tr>
  );
};
