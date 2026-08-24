import { type FC, useMemo, useState } from "react";
import { Button, ButtonGroup, Col, Container, Row } from "react-bootstrap";
import {
  DashCircle,
  EnvelopeFill,
  PencilFill,
  PlayFill,
  PlusCircle,
  StopFill,
  TrashFill,
} from "react-bootstrap-icons";
import { formatDate, formatDateTime } from "@/shared/constants";
import { type Language, LanguageStatus } from "../../domain/Entity/Language";
import { ContactOwnerModal } from "../ContactOwnerModal";

export interface LanguageRowProps {
  language: Language;
  onLanguageEdit: (language: Language) => void;
  onLanguageDelete: (language: Language) => void;
  onLanguageActivate: (language: Language) => void;
  onLanguageDeactivate: (language: Language) => void;
}

export const LanguageRowComponent: FC<LanguageRowProps> = ({
  language,
  onLanguageEdit,
  onLanguageDelete,
  onLanguageActivate,
  onLanguageDeactivate,
}) => {
  const [show, setShow] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const owner = useMemo(() => {
    if (!language.owners) return null;

    return language.owners?.find((owner) => owner.accessLevel === "OWNER");
  }, [language.owners]);

  const isActive =
    language.stateAccept === LanguageStatus.ACTIVE ||
    language.stateAccept === LanguageStatus.APPROVED;

  const isDisabledOrPending =
    language.stateAccept === LanguageStatus.DISABLED ||
    language.stateAccept === LanguageStatus.PENDING ||
    language.stateAccept === LanguageStatus.DRAFT ||
    language.stateAccept === LanguageStatus.REQUEST_CHANGES;

  const isDeleted = language.stateAccept === LanguageStatus.DELETED;

  return (
    <>
      <tr>
        <td
          title={language.name}
          aria-label={language.name}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {language.name}
        </td>

        <td
          title={language.type}
          aria-label={language.type}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {language.type}
        </td>

        <td
          title={language.stateAccept}
          aria-label={language.stateAccept}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {language.stateAccept}
        </td>

        <td>{owner?.name}</td>

        <td>
          {language.createdAt
            ? formatDate(new Date(language.createdAt))
            : "N/A"}
        </td>

        <td>
          {language.updatedAt
            ? formatDateTime(new Date(language.updatedAt))
            : "N/A"}
        </td>

        <td>
          <ButtonGroup size="sm">
            <Button
              variant="primary"
              onClick={() => onLanguageEdit(language)}
              title="Edit language"
            >
              <PencilFill />
            </Button>

            {isActive && (
              <Button
                variant="warning"
                onClick={() => onLanguageDeactivate(language)}
                title="Deactivate language"
              >
                <StopFill />
              </Button>
            )}

            {isDisabledOrPending && (
              <Button
                variant="success"
                onClick={() => onLanguageActivate(language)}
                title="Activate language"
              >
                <PlayFill />
              </Button>
            )}

            {!isActive && !isDeleted && (
              <Button
                variant="danger"
                onClick={() => onLanguageDelete(language)}
                title="Delete language"
              >
                <TrashFill />
              </Button>
            )}

            <Button
              size="sm"
              variant="info"
              onClick={() => setShow((isShown) => !isShown)}
              title="Show/Hide language details"
            >
              {!show ? <PlusCircle /> : <DashCircle />}
            </Button>
          </ButtonGroup>
        </td>
      </tr>

      {show && (
        <tr>
          <td colSpan={7}>
            <LanguageDetails
              language={language}
              onContactClick={() => setShowContactModal(true)}
            />
          </td>
        </tr>
      )}

      {showContactModal && (
        <ContactOwnerModal
          show={showContactModal}
          onClose={() => setShowContactModal(false)}
          owners={language.owners || []}
          languageName={language.name || ""}
        />
      )}
    </>
  );
};

interface LanguageDetailsProps {
  language: Language;
  onContactClick: () => void;
}

const LanguageDetails: FC<LanguageDetailsProps> = ({
  language,
  onContactClick,
}) => {
  return (
    <Container>
      <Row className="align-items-center">
        <Col xs={2} className="fw-bold">
          Name
        </Col>

        <Col xs={10}>{language.name}</Col>
      </Row>

      <Row className="align-items-center mt-2">
        <Col xs={2} className="fw-bold">
          Owners
        </Col>

        <Col xs={6}>
          {(language.owners || [])
            .map((owner) => `${owner.name} (${owner.email})`)
            .join(", ") || "No owners registered"}
        </Col>

        <Col xs={4} className="text-end">
          {language.owners && language.owners.length > 0 && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={onContactClick}
              title="Contact Language Owners"
            >
              <EnvelopeFill className="me-1" /> Contact Owners
            </Button>
          )}
        </Col>
      </Row>
    </Container>
  );
};
