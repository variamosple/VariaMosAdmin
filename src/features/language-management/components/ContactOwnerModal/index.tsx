import type { FC } from "react";
import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import type { LanguageOwner } from "../../domain/Entity/Language";

export interface ContactOwnerModalProps {
  show: boolean;
  onClose: () => void;
  owners: LanguageOwner[];
  languageName: string;
}

export const ContactOwnerModal: FC<ContactOwnerModalProps> = ({
  show,
  onClose,
  owners,
  languageName,
}) => {
  const [subjectKey, setSubjectKey] = useState("GENERAL_INQUIRY");
  const [customBody, setCustomBody] = useState("");

  const emailList = owners
    .map((owner) => owner.email)
    .filter(Boolean)
    .join(",");

  const subjects: Record<string, string> = {
    GENERAL_INQUIRY: `Inquiry regarding Language: ${languageName}`,
    BUG_REPORT: `Bug Report for Language: ${languageName}`,
    REQUEST_CHANGES: `Request Changes for Language: ${languageName}`,
    STATUS_UPDATE: `Status Update Request for Language: ${languageName}`,
  };

  const mailtoHref = `mailto:${emailList}?subject=${encodeURIComponent(
    subjects[subjectKey] || subjects.GENERAL_INQUIRY,
  )}&body=${encodeURIComponent(
    customBody ||
      `Hello,\n\nI am reaching out to you as the owner of the language '${languageName}' registered on VariaMos Admin.\n\nBest regards,\nVariaMos Administration Team`,
  )}`;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Contact Owners of {languageName}</Modal.Title>
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
