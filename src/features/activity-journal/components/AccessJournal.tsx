import type { FC } from "react";
import { Col, Form, Row, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { formatDateTime } from "@/shared/constants";
import { queryAccessLogs } from "../api/JournalRepository";
import { ACCESS_EVENTS, AccessFilter } from "../domain/JournalEntry";
import { useJournal } from "../hooks/useJournal";
import {
  accountLabel,
  type CommonFields,
  CommonFilterFields,
  commonFilterOf,
  JournalResults,
  OutcomeBadge,
  SearchButtons,
} from "./JournalCommon";

interface AccessFields extends CommonFields {
  event?: string;
  reason?: string;
  ip?: string;
}

const initialFilter = () => new AccessFilter();

/** Sign-ins, locks and refused requests. */
export const AccessJournal: FC = () => {
  const journal = useJournal(queryAccessLogs, initialFilter);
  const { register, handleSubmit, reset } = useForm<AccessFields>();

  const onSubmit = (fields: AccessFields) =>
    journal.search(
      new AccessFilter({
        ...commonFilterOf(fields),
        event: fields.event || undefined,
        reason: fields.reason?.trim() || undefined,
        ip: fields.ip?.trim() || undefined,
      }),
    );

  const onReset = () => {
    reset({});
    journal.search(initialFilter());
  };

  return (
    <>
      <Form onSubmit={handleSubmit(onSubmit)} className="mb-3">
        <Row className="g-2">
          <CommonFilterFields
            from={register("from")}
            to={register("to")}
            user={register("user")}
            outcome={register("outcome")}
          />
          <Col md={3}>
            <Form.Group controlId="access-event">
              <Form.Label>Event</Form.Label>
              <Form.Select {...register("event")}>
                <option value="">All</option>
                {ACCESS_EVENTS.map((event) => (
                  <option key={event} value={event}>
                    {event}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="access-reason">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                placeholder="locked, wrong_code…"
                maxLength={64}
                {...register("reason")}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="access-ip">
              <Form.Label>IP address</Form.Label>
              <Form.Control maxLength={64} {...register("ip")} />
            </Form.Group>
          </Col>
          <SearchButtons isLoading={journal.isLoading} onReset={onReset} />
        </Row>
      </Form>

      <JournalResults {...journal}>
        <Table striped bordered hover size="sm" responsive>
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Outcome</th>
              <th>Reason</th>
              <th>Account</th>
              <th>IP address</th>
              <th>Request</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {journal.entries.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDateTime(entry.occurredAt)}</td>
                <td>{entry.event}</td>
                <td>
                  <OutcomeBadge outcome={entry.outcome} />
                </td>
                <td>{entry.reason ?? "—"}</td>
                <td>{accountLabel(entry.userId, entry.user)}</td>
                <td>{entry.ip ?? "—"}</td>
                <td>
                  {entry.method} {entry.path}
                </td>
                <td>{entry.statusCode ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </JournalResults>
    </>
  );
};
