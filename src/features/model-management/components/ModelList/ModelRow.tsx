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

export const ModelRowComponent: FC<ModelRowProps> = ({
  model,
  onModelEdit,
  onModelDelete,
  onModelToggleLevel,
  onModelToggleVisibility,
}) => {
  const [show, setShow] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLevelConfirm, setShowLevelConfirm] = useState(false);
  const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);

  const isActive = !model.isDeleted;

  return (
    <>
      <tr>
        <td style={{ whiteSpace: "wrap" }}>{model.name}</td>

        <td
          title={model.description}
          aria-label={model.description}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {model.description}
        </td>

        <td
          title={model.author}
          aria-label={model.author}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {model.author}
        </td>

        <td
          title={model.source}
          aria-label={model.source}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {model.source}
        </td>

        <td
          title={model.engineeringType}
          aria-label={model.engineeringType}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {model.engineeringType}
        </td>

        <td
          title={model.projectName}
          aria-label={model.projectName}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {model.projectName}
        </td>

        <td>{formatBoolean(model.isPublic, "Public", "Private")}</td>

        <td>
          {model.modelLevel === "application"
            ? "Application Model"
            : "Domain Model"}
        </td>

        <td>{model.isDeleted ? "Deleted" : "Active"}</td>

        <td>
          <ButtonGroup size="sm">
            <IconButton
              variant="primary"
              onClick={() => onModelEdit(model)}
              label="Edit model"
              icon={<PencilFill />}
            />

            <IconButton
              variant="danger"
              onClick={() => onModelDelete(model)}
              label="Delete model"
              icon={<TrashFill />}
            />

            {isActive && (
              <>
                <IconButton
                  variant="warning"
                  onClick={() => setShowLevelConfirm(true)}
                  label="Toggle model level (Domain/Application)"
                  icon={<ArrowRepeat />}
                />

                <IconButton
                  variant="secondary"
                  onClick={() => setShowVisibilityConfirm(true)}
                  label="Toggle model visibility (Public/Private)"
                  icon={<LockFill />}
                />
              </>
            )}

            <IconButton
              size="sm"
              variant="info"
              onClick={() => setShow((isShown) => !isShown)}
              label="Show/Hide model details"
              icon={!show ? <PlusCircle /> : <DashCircle />}
            />
          </ButtonGroup>
        </td>
      </tr>

      {show && (
        <tr>
          <td colSpan={10}>
            <ModelDetails
              model={model}
              onContactClick={() => setShowContactModal(true)}
            />
          </td>
        </tr>
      )}

      {showContactModal && (
        <ContactOwnerModal
          show={showContactModal}
          onClose={() => setShowContactModal(false)}
          owners={model.owners || []}
          entityName={model.name || ""}
          entityType="Model"
        />
      )}

      <ConfirmationModal
        show={showLevelConfirm}
        title="Change model level"
        message={`Change the level of the model "${model.name}" to ${model.modelLevel === "application" ? "Domain Model" : "Application Model"}?`}
        confirmLabel="Change level"
        confirmButtonVariant="warning"
        onConfirm={() => {
          onModelToggleLevel(model);
          setShowLevelConfirm(false);
        }}
        onCancel={() => setShowLevelConfirm(false)}
      />

      <ConfirmationModal
        show={showVisibilityConfirm}
        title="Change model visibility"
        message={`Make the model "${model.name}" ${model.isPublic ? "private" : "public"}?`}
        confirmLabel={model.isPublic ? "Make private" : "Make public"}
        confirmButtonVariant="secondary"
        onConfirm={() => {
          onModelToggleVisibility(model);
          setShowVisibilityConfirm(false);
        }}
        onCancel={() => setShowVisibilityConfirm(false)}
      />
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

        <Col xs={10}>
          {model.modelLevel === "application"
            ? "Application Model"
            : "Domain Model"}
        </Col>
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
            .map((owner) => `${owner.name || "N/A"} (${owner.email})`)
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
