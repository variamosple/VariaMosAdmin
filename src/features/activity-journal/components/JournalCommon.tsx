import { Paginator } from "@variamosple/variamos-components";
import type { FC, ReactNode } from "react";
import { Alert, Badge, Button, Col, Form, Row, Spinner } from "react-bootstrap";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { JournalAccount } from "../domain/JournalEntry";

/** The fields of the search form shared by both journals. */
export interface CommonFields {
  from?: string;
  to?: string;
  user?: string;
  outcome?: string;
}

/** A local date and time of the form, as the ISO date the server reads. */
const toIsoDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

/** The period, account and outcome, as filters for the server. */
export const commonFilterOf = (fields: CommonFields) => ({
  from: toIsoDate(fields.from),
  to: toIsoDate(fields.to),
  user: fields.user?.trim() || undefined,
  outcome: fields.outcome || undefined,
});

/** Name and e-mail of the account, or its id once it is deleted. */
export const accountLabel = (
  id: string | null,
  account: JournalAccount | null,
): string => {
  if (account) {
    return [account.name, account.email && `(${account.email})`]
      .filter(Boolean)
      .join(" ");
  }
  return id ? `${id} (deleted account)` : "—";
};

export const OutcomeBadge: FC<{ outcome: string }> = ({ outcome }) => (
  <Badge bg={outcome === "success" ? "success" : "danger"}>{outcome}</Badge>
);

/** Period, account and outcome, registered by the form of each journal. */
export const CommonFilterFields: FC<
  Record<keyof CommonFields, UseFormRegisterReturn>
> = ({ from, to, user, outcome }) => {
  return (
    <>
      <Col md={3}>
        <Form.Group controlId="journal-from">
          <Form.Label>From</Form.Label>
          <Form.Control type="datetime-local" {...from} />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group controlId="journal-to">
          <Form.Label>To</Form.Label>
          <Form.Control type="datetime-local" {...to} />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group controlId="journal-user">
          <Form.Label>Account</Form.Label>
          <Form.Control
            placeholder="Name, e-mail or id"
            maxLength={255}
            {...user}
          />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group controlId="journal-outcome">
          <Form.Label>Outcome</Form.Label>
          <Form.Select {...outcome}>
            <option value="">All</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
          </Form.Select>
        </Form.Group>
      </Col>
    </>
  );
};

export const SearchButtons: FC<{ isLoading: boolean; onReset: () => void }> = ({
  isLoading,
  onReset,
}) => (
  <Col xs="auto" className="d-flex gap-2 align-items-end">
    <Button type="submit" disabled={isLoading}>
      Search
    </Button>
    <Button variant="outline-secondary" onClick={onReset} disabled={isLoading}>
      Reset
    </Button>
  </Col>
);

/** Error, count, paginator and spinner around the table of a journal. */
export const JournalResults: FC<{
  error?: string;
  isLoading: boolean;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  children: ReactNode;
}> = ({
  error,
  isLoading,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  children,
}) => {
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" variant="primary" className="me-2" />
        <span>Loading the journal...</span>
      </div>
    );
  }
  if (totalItems === 0) {
    return <Alert variant="secondary">No entry for these filters.</Alert>;
  }
  return (
    <>
      <Row className="align-items-center mb-2">
        <Col>
          {totalItems} {totalItems === 1 ? "entry" : "entries"}, newest first
        </Col>
        <Col xs="auto">
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </Col>
      </Row>
      {children}
    </>
  );
};
