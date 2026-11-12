import { type FC, useState } from "react";
import { Button, ButtonGroup, Col, Container, Row } from "react-bootstrap";
import {
  ArrowRepeat,
  DashCircle,
  EnvelopeFill,
  LockFill,
  PencilFill,
  PlusCircle,
  TrashFill,
} from "react-bootstrap-icons";
import type { Model } from "@/features/model-management/domain/Entity/Model";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { ContactOwnerModal } from "@/shared/components/ContactOwnerModal";
import { IconButton } from "@/shared/components/IconButton";
import { formatBoolean } from "@/shared/constants";

export interface ModelRowProps {
  model: Model;
  onModelEdit: (model: Model) => void;
  onModelDelete: (model: Model) => void;
  onModelToggleLevel: (model: Model) => void;
  onModelToggleVisibility: (model: Model) => void;
}

const levelLabel = (model: Model) =>
  model.modelLevel === "application" ? "Application Model" : "Domain Model";

// A long text on one line, whole in its tooltip
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

interface ModelActionsProps extends ModelRowProps {
  showDetails: boolean;
  onToggleDetails: () => void;
  onAskLevel: () => void;
  onAskVisibility: () => void;
}

const ModelActions: FC<ModelActionsProps> = (props) => {
  const { model } = props;
  return (
    <ButtonGroup size="sm">
      <IconButton
        variant="primary"
        onClick={() => props.onModelEdit(model)}
        label="Edit model"
        icon={<PencilFill />}
      />

      <IconButton
        variant="danger"
        onClick={() => props.onModelDelete(model)}
        label="Delete model"
        icon={<TrashFill />}
      />

      {model.isDeleted ? null : (
        <>
          <IconButton
            variant="warning"
            onClick={props.onAskLevel}
            label="Toggle model level (Domain/Application)"
            icon={<ArrowRepeat />}
          />

          <IconButton
            variant="secondary"
            onClick={props.onAskVisibility}
            label="Toggle model visibility (Public/Private)"
            icon={<LockFill />}
          />
        </>
      )}

      <IconButton
        size="sm"
        variant="info"
        onClick={props.onToggleDetails}
        label="Show/Hide model details"
        icon={props.showDetails ? <DashCircle /> : <PlusCircle />}
      />
    </ButtonGroup>
  );
};

type Asked = "level" | "visibility" | null;

interface ToggleConfirmationsProps extends ModelRowProps {
  asked: Asked;
  setAsked: (asked: Asked) => void;
}

// The level and the visibility change once confirmed
const ToggleConfirmations: FC<ToggleConfirmationsProps> = (props) => {
  const { model, asked, setAsked } = props;
  return (
    <>
      <ConfirmationModal
        show={asked === "level"}
        title="Change model level"
        message={`Change the level of the model "${model.name}" to ${model.modelLevel === "application" ? "Domain Model" : "Application Model"}?`}
        confirmLabel="Change level"
        confirmButtonVariant="warning"
        onConfirm={() => {
          props.onModelToggleLevel(model);
          setAsked(null);
        }}
        onCancel={() => setAsked(null)}
      />

      <ConfirmationModal
        show={asked === "visibility"}
        title="Change model visibility"
        message={`Make the model "${model.name}" ${model.isPublic ? "private" : "public"}?`}
        confirmLabel={model.isPublic ? "Make private" : "Make public"}
        confirmButtonVariant="secondary"
        onConfirm={() => {
          props.onModelToggleVisibility(model);
          setAsked(null);
        }}
        onCancel={() => setAsked(null)}
      />
    </>
  );
};

export const ModelRowComponent: FC<ModelRowProps> = (props) => {
  const { model } = props;
  const [show, setShow] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [asked, setAsked] = useState<Asked>(null);

  return (
    <>
      <tr>
        <td style={{ whiteSpace: "wrap" }}>{model.name}</td>
        <TruncatedCell text={model.description} />
        <TruncatedCell text={model.author} />
        <TruncatedCell text={model.source} />
        <TruncatedCell text={model.engineeringType} />
        <TruncatedCell text={model.projectName} />
        <td>{formatBoolean(model.isPublic, "Public", "Private")}</td>
        <td>{levelLabel(model)}</td>
        <td>{model.isDeleted ? "Deleted" : "Active"}</td>
        <td>
          <ModelActions
            {...props}
            showDetails={show}
            onToggleDetails={() => setShow((isShown) => !isShown)}
            onAskLevel={() => setAsked("level")}
            onAskVisibility={() => setAsked("visibility")}
          />
        </td>
      </tr>

      {show ? (
        <tr>
          <td colSpan={10}>
            <ModelDetails
              model={model}
              onContactClick={() => setShowContactModal(true)}
            />
          </td>
        </tr>
      ) : null}

      {showContactModal ? (
        <ContactOwnerModal
          show={showContactModal}
          onClose={() => setShowContactModal(false)}
          owners={model.owners || []}
          entityName={model.name || ""}
          entityType="Model"
        />
      ) : null}

      <ToggleConfirmations {...props} asked={asked} setAsked={setAsked} />
    </>
  );
};

interface ModelDetailsProps {
  model: Model;
  onContactClick: () => void;
}

const ModelDetails: FC<ModelDetailsProps> = ({ model, onContactClick }) => {
  return (
    <Container>
      <Row className="mb-2">
        <Col xs={2} className="fw-bold">
          Name
        </Col>

        <Col xs={10}>{model.name}</Col>
      </Row>
      <Row className="mb-2">
        <Col xs={2} className="fw-bold">
          Level
        </Col>

        <Col xs={10}>{levelLabel(model)}</Col>
      </Row>
      <Row className="mb-2">
        <Col xs={2} className="fw-bold">
          Visibility
        </Col>

        <Col xs={10}>{model.isPublic ? "Public" : "Private"}</Col>
      </Row>
      <Row className="mb-2">
        <Col xs={2} className="fw-bold">
          Author
        </Col>

        <Col xs={10}>{model.author}</Col>
      </Row>
      <Row className="mb-2">
        <Col xs={2} className="fw-bold">
          Description
        </Col>

        <Col xs={10}>{model.description}</Col>
      </Row>
      <Row className="mb-2">
        <Col xs={2} className="fw-bold">
          Source
        </Col>

        <Col xs={10}>{model.source}</Col>
      </Row>
      <Row className="mb-2">
        <Col xs={2} className="fw-bold">
          Project
        </Col>

        <Col xs={10}>{model.projectName}</Col>
      </Row>

      <Row className="align-items-center mb-2">
        <Col xs={2} className="fw-bold">
          Owners
        </Col>

        <Col xs={6}>
          {(model.owners || [])
            .map(
              (owner) =>
                `${owner.name || "N/A"} (${owner.email || "no email"})`,
            )
            .join(", ") || "No owners registered"}
        </Col>

        <Col xs={4} className="text-end">
          {model.owners && model.owners.length > 0 && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={onContactClick}
              title="Contact Model Owners"
            >
              <EnvelopeFill className="me-1" /> Contact Owners
            </Button>
          )}
        </Col>
      </Row>
    </Container>
  );
};
