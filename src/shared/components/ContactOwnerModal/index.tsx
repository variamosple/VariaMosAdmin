import {
  isUnsavedInput,
  useDiscardConfirmation,
} from "@variamosple/variamos-components";
import type { FC } from "react";
import { useId, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { ClosingFooter } from "@/shared/components/FormModal/ClosingFooter";

interface Owner {
  id?: string | number;
  name?: string;
  email?: string;
}

export interface ContactOwnerModalProps {
  show: boolean;
  onClose: () => void;
  owners: Owner[];
  entityName: string;
  entityType: "Language" | "Project" | "Model";
}

const DEFAULT_SUBJECT = "GENERAL_INQUIRY";

export const ContactOwnerModal: FC<ContactOwnerModalProps> = ({
  show,
  onClose,
  owners,
  entityName,
  entityType,
}) => {
  const [subjectKey, setSubjectKey] = useState(DEFAULT_SUBJECT);
  const [customBody, setCustomBody] = useState("");

  // Sent or dropped, the message starts again from the default subject
  const close = () => {
    setSubjectKey(DEFAULT_SUBJECT);
    setCustomBody("");
    onClose();
  };
  // Closing with a message written asks first (UX-08)
  const closing = useDiscardConfirmation({
    holdsInput:
      show &&
      isUnsavedInput(
        { subjectKey: DEFAULT_SUBJECT },
        { subjectKey, customBody },
      ),
    onClose: close,
  });

  const hasEmail = (owner: Owner) =>
    typeof owner.email === "string" && owner.email.trim() !== "";
  const emailList = owners
    .filter(hasEmail)
    .map((owner) => owner.email)
    .join(",");
  const ownersWithoutEmail = owners
    .filter((owner) => !hasEmail(owner))
    .map((owner) => owner.name || "Unnamed owner");

  const generalInquiry = `Inquiry regarding ${entityType}: ${entityName}`;
  const subjects: Record<string, string> = {
    GENERAL_INQUIRY: generalInquiry,
    BUG_REPORT: `Bug Report for ${entityType}: ${entityName}`,
    REQUEST_CHANGES: `Request Changes for ${entityType}: ${entityName}`,
    STATUS_UPDATE: `Status Update Request for ${entityType}: ${entityName}`,
  };

  const mailtoHref = `mailto:${emailList}?subject=${encodeURIComponent(
    subjects[subjectKey] || generalInquiry,
  )}&body=${encodeURIComponent(
    customBody ||
      `Hello,\n\nI am reaching out to you as the owner of the ${entityType.toLowerCase()} '${entityName}' registered on VariaMos Admin.\n\nBest regards,\nVariaMos Administration Team`,
  )}`;

  const titleId = useId();

  return (
    <Modal
      aria-labelledby={titleId}
      show={show}
      onHide={closing.requestClose}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id={titleId}>Contact Owners of {entityName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="contact-subject">
            <Form.Label>Subject</Form.Label>
            <Form.Select
              value={subjectKey}
              onChange={(e) => setSubjectKey(e.target.value)}
            >
              <option value="GENERAL_INQUIRY">General Inquiry</option>
              <option value="BUG_REPORT">Bug Report</option>
              <option value="REQUEST_CHANGES">Request Changes</option>
              <option value="STATUS_UPDATE">Status Update Request</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="contact-body">
            <Form.Label>Message Body (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Write your message here..."
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
            />
          </Form.Group>
        </Form>
        {!emailList ? (
          <Alert variant="warning" className="mb-0">
            No email address is registered for the owners of {entityName}.
          </Alert>
        ) : (
          ownersWithoutEmail.length > 0 && (
            <Alert variant="info" className="mb-0">
              Not reached, no email address registered:{" "}
              {ownersWithoutEmail.join(", ")}.
            </Alert>
          )
        )}
      </Modal.Body>
      <ClosingFooter closing={closing}>
        <Button variant="secondary" onClick={closing.requestClose}>
          Cancel
        </Button>
        <a
          className={`btn btn-primary ${!emailList ? "disabled" : ""}`}
          href={emailList ? mailtoHref : undefined}
          aria-disabled={!emailList}
          onClick={close}
          title="Send Email"
        >
          Send Email
        </a>
      </ClosingFooter>
    </Modal>
  );
};
