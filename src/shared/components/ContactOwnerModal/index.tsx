import type { FC } from "react";
import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

export interface Owner {
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

export const ContactOwnerModal: FC<ContactOwnerModalProps> = ({
  show,
  onClose,
  owners,
  entityName,
  entityType,
}) => {
  const [subjectKey, setSubjectKey] = useState("GENERAL_INQUIRY");
  const [customBody, setCustomBody] = useState("");

  const emailList = owners
    .map((owner) => owner.email)
    .filter(
      (email): email is string =>
        typeof email === "string" && email.trim() !== "",
    )
    .join(",");

  const subjects: Record<string, string> = {
    GENERAL_INQUIRY: `Inquiry regarding ${entityType}: ${entityName}`,
    BUG_REPORT: `Bug Report for ${entityType}: ${entityName}`,
    REQUEST_CHANGES: `Request Changes for ${entityType}: ${entityName}`,
    STATUS_UPDATE: `Status Update Request for ${entityType}: ${entityName}`,
  };

  const mailtoHref = `mailto:${emailList}?subject=${encodeURIComponent(
    subjects[subjectKey] || subjects.GENERAL_INQUIRY,
  )}&body=${encodeURIComponent(
    customBody ||
      `Hello,\n\nI am reaching out to you as the owner of the ${entityType.toLowerCase()} '${entityName}' registered on VariaMos Admin.\n\nBest regards,\nVariaMos Administration Team`,
  )}`;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Contact Owners of {entityName}</Modal.Title>
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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <a
          className={`btn btn-primary ${!emailList ? "disabled" : ""}`}
          href={emailList ? mailtoHref : undefined}
          onClick={onClose}
          title="Send Email"
        >
          Send Email
        </a>
      </Modal.Footer>
    </Modal>
  );
};
