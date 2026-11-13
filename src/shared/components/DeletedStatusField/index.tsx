import type { FC } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import type { UseFormRegisterReturn } from "react-hook-form";
import { IconButton } from "@/shared/components/IconButton";

export interface DeletedStatusFieldProps {
  /** The `isDeleted` field of the search form: "false", "true" or "all". */
  registration: UseFormRegisterReturn;
  onReset: () => void;
  isLoading?: boolean;
}

/** The Status choice of a search form (active, deleted, all) and its Clear button. */
export const DeletedStatusField: FC<DeletedStatusFieldProps> = ({
  registration,
  onReset,
  isLoading,
}) => (
  <Form.Group className="w-100" controlId="isDeleted">
    <Form.Label>Status</Form.Label>
    <InputGroup>
      <Form.Select
        className="form-control"
        aria-label="Status"
        {...registration}
      >
        <option value="false">Active</option>
        <option value="true">Deleted</option>
        <option value="all">All</option>
      </Form.Select>
      <IconButton
        label="Clear results"
        variant="outline-secondary"
        onClick={onReset}
        className="fw-bold"
        disabled={isLoading}
        icon={<Trash />}
      />
    </InputGroup>
  </Form.Group>
);
