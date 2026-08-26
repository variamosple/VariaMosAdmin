import ConfirmationModal from "@variamosple/variamos-components/dist/Components/ConfirmationModal";
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
import { ContactOwnerModal } from "@/shared/components/ContactOwnerModal";
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
            <Button
              variant="primary"
              onClick={() => onModelEdit(model)}
              title="Edit model"
            >
              <PencilFill />
            </Button>

            <Button
              variant="danger"
              onClick={() => onModelDelete(model)}
              title="Delete model"
            >
              <TrashFill />
            </Button>

            {isActive && (
              <>
                <Button
                  variant="warning"
                  onClick={() => setShowLevelConfirm(true)}
                  title="Toggle model level (Domain/Application)"
                >
                  <ArrowRepeat />
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setShowVisibilityConfirm(true)}
                  title="Toggle model visibility (Public/Private)"
                >
                  <LockFill />
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="info"
              onClick={() => setShow((isShown) => !isShown)}
              title="Show/Hide model details"
            >
              {!show ? <PlusCircle /> : <DashCircle />}
            </Button>
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
        message={`Are you sure you want to change this model level to ${model.modelLevel === "application" ? "Domain Model" : "Application Model"}?`}
        confirmButtonVariant="warning"
        onConfirm={() => {
          onModelToggleLevel(model);
          setShowLevelConfirm(false);
        }}
        onCancel={() => setShowLevelConfirm(false)}
      />

      <ConfirmationModal
        show={showVisibilityConfirm}
        message={`Are you sure you want to change this model visibility to ${model.isPublic ? "Private" : "Public"}?`}
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
