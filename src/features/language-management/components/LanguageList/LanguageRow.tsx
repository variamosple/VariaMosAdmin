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
import { ContactOwnerModal } from "@/shared/components/ContactOwnerModal";
import { DateTime } from "@/shared/components/DateTime";
import { IconButton } from "@/shared/components/IconButton";
import { type Language, LanguageStatus } from "../../domain/Entity/Language";

export interface LanguageRowProps {
  language: Language;
  onLanguageEdit: (language: Language) => void;
  onLanguageDelete: (language: Language) => void;
  onLanguageActivate: (language: Language) => void;
  onLanguageDeactivate: (language: Language) => void;
}

// What can be done with a language, from its state
const actionsOf = (language: Language) => {
  const isActive =
    language.stateAccept === LanguageStatus.ACTIVE ||
    language.stateAccept === LanguageStatus.APPROVED;

  const isDisabledOrPending =
    language.stateAccept === LanguageStatus.DISABLED ||
    language.stateAccept === LanguageStatus.PENDING ||
    language.stateAccept === LanguageStatus.DRAFT ||
    language.stateAccept === LanguageStatus.REQUEST_CHANGES;

  const isDeleted = language.stateAccept === LanguageStatus.DELETED;

  return {
    canDeactivate: isActive,
    canActivate: isDisabledOrPending,
    canDelete: !isActive && !isDeleted,
  };
};

const TruncatedCell: FC<{ text?: string }> = ({ text }) => (
  <td
    title={text}
    aria-label={text}
    style={{
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "150px",
    }}
  >
    {text}
  </td>
);

interface LanguageActionsProps extends LanguageRowProps {
  show: boolean;
  onToggleDetails: () => void;
}

const LanguageActions: FC<LanguageActionsProps> = (props) => {
  const { language, show } = props;
  const { canDeactivate, canActivate, canDelete } = actionsOf(language);
  return (
    <ButtonGroup size="sm">
      <IconButton
        variant="primary"
        onClick={() => props.onLanguageEdit(language)}
        label="Edit language"
        icon={<PencilFill />}
      />

      {canDeactivate ? (
        <IconButton
          variant="warning"
          onClick={() => props.onLanguageDeactivate(language)}
          label="Deactivate language"
          icon={<StopFill />}
        />
      ) : null}

      {canActivate ? (
        <IconButton
          variant="success"
          onClick={() => props.onLanguageActivate(language)}
          label="Activate language"
          icon={<PlayFill />}
        />
      ) : null}

      {canDelete ? (
        <IconButton
          variant="danger"
          onClick={() => props.onLanguageDelete(language)}
          label="Delete language"
          icon={<TrashFill />}
        />
      ) : null}

      <IconButton
        size="sm"
        variant="info"
        onClick={props.onToggleDetails}
        label="Show/Hide language details"
        icon={!show ? <PlusCircle /> : <DashCircle />}
      />
    </ButtonGroup>
  );
};

export const LanguageRowComponent: FC<LanguageRowProps> = (props) => {
  const { language } = props;
  const [show, setShow] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const owner = useMemo(() => {
    if (!language.owners) return null;

    return language.owners?.find(
      (candidate) => candidate.accessLevel === "OWNER",
    );
  }, [language.owners]);

  return (
    <>
      <tr>
        <TruncatedCell text={language.name} />
        <TruncatedCell text={language.type} />
        <TruncatedCell text={language.stateAccept} />

        <td>{owner?.name}</td>

        <td>
          <DateTime value={language.createdAt} dateOnly />
        </td>

        <td>
          <DateTime value={language.updatedAt} />
        </td>

        <td>
          <LanguageActions
            {...props}
            show={show}
            onToggleDetails={() => setShow((isShown) => !isShown)}
          />
        </td>
      </tr>

      {show ? (
        <tr>
          <td colSpan={7}>
            <LanguageDetails
              language={language}
              onContactClick={() => setShowContactModal(true)}
            />
          </td>
        </tr>
      ) : null}

      {showContactModal ? (
        <ContactOwnerModal
          show={showContactModal}
          onClose={() => setShowContactModal(false)}
          owners={language.owners || []}
          entityName={language.name || ""}
          entityType="Language"
        />
      ) : null}
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
            .map((owner) => `${owner.name} (${owner.email || "no email"})`)
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
