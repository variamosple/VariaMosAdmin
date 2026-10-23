import { type FC, Fragment, useState } from "react";
import { Button, Col, Form, Row, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { formatDateTime } from "@/shared/constants";
import { queryActivityLogs } from "../api/JournalRepository";
import {
  ACTIVITY_ACTIONS,
  type ActivityEntry,
  ActivityFilter,
  ENTITY_TYPES,
  type JsonValue,
} from "../domain/JournalEntry";
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

interface ActivityFields extends CommonFields {
  action?: string;
  entityType?: string;
  entityId?: string;
}

const initialFilter = () => new ActivityFilter();

const valuesOf = (values: JsonValue | undefined) =>
  values === null || values === undefined
    ? "—"
    : JSON.stringify(values, null, 2);

const EntryDetails: FC<{ entry: ActivityEntry }> = ({ entry }) => (
  <Row>
    <Col md={6}>
      <strong>Before</strong>
      <pre className="mb-0">{valuesOf(entry.before)}</pre>
    </Col>
    <Col md={6}>
      <strong>After</strong>
      <pre className="mb-0">{valuesOf(entry.after)}</pre>
    </Col>
    <Col xs={12} className="text-muted small">
      Error code: {entry.errorCode ?? "—"} · Transaction:{" "}
      {entry.transactionId ?? "—"}
    </Col>
  </Row>
);

/** Who did which administration operation, and with what result. */
export const ActivityJournal: FC = () => {
  const journal = useJournal(queryActivityLogs, initialFilter);
  const { register, handleSubmit, reset } = useForm<ActivityFields>();
  const [opened, setOpened] = useState<string>();

  const onSubmit = (fields: ActivityFields) =>
    journal.search(
      new ActivityFilter({
        ...commonFilterOf(fields),
        action: fields.action || undefined,
        entityType: fields.entityType || undefined,
        entityId: fields.entityId?.trim() || undefined,
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
            <Form.Group controlId="activity-action">
              <Form.Label>Action</Form.Label>
              <Form.Select {...register("action")}>
                <option value="">All</option>
                {ACTIVITY_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="activity-entity-type">
              <Form.Label>Entity</Form.Label>
              <Form.Select {...register("entityType")}>
                <option value="">All</option>
                {ENTITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="activity-entity-id">
              <Form.Label>Entity id</Form.Label>
              <Form.Control maxLength={255} {...register("entityId")} />
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
              <th>Author</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Outcome</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {journal.entries.map((entry) => (
              <Fragment key={entry.id}>
                <tr>
                  <td>{formatDateTime(entry.occurredAt)}</td>
                  <td>{accountLabel(entry.actorId, entry.actor)}</td>
                  <td>{entry.action}</td>
                  <td>
                    {entry.entityType}
                    {entry.entityId ? ` ${entry.entityId}` : ""}
                  </td>
                  <td>
                    <OutcomeBadge outcome={entry.outcome} />
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      aria-expanded={opened === entry.id}
                      onClick={() =>
                        setOpened(opened === entry.id ? undefined : entry.id)
                      }
                    >
                      {opened === entry.id ? "Hide" : "Show"}
                    </Button>
                  </td>
                </tr>
                {opened === entry.id && (
                  <tr>
                    <td colSpan={6}>
                      <EntryDetails entry={entry} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </Table>
      </JournalResults>
    </>
  );
};
