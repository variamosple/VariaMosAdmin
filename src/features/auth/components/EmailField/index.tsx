import type { FC } from "react";
import { Form } from "react-bootstrap";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

export interface EmailFieldProps {
  /** The `email` field, registered as required by the form. */
  registration: UseFormRegisterReturn;
  error?: FieldError;
}

/** The Email Address field of the sign-in, sign-up and forgotten password forms. */
export const EmailField: FC<EmailFieldProps> = ({ registration, error }) => (
  <Form.Group className="w-100" controlId="email">
    <Form.Label className="form-label align-self-start m-0">
      Email Address
    </Form.Label>
    <Form.Control
      type="email"
      className="form-control"
      placeholder="name@example.com"
      {...registration}
      isInvalid={Boolean(error)}
    />
    <Form.Control.Feedback type="invalid">
      {error?.message}
    </Form.Control.Feedback>
  </Form.Group>
);
