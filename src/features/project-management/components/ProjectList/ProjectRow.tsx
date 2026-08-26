import { type FC, useState } from "react";
import {
  Accordion,
  Button,
  ButtonGroup,
  Col,
  Container,
  Row,
} from "react-bootstrap";
import {
  DashCircle,
  EnvelopeFill,
  PencilFill,
  PlusCircle,
  TrashFill,
} from "react-bootstrap-icons";
import type { Project } from "@/features/project-management/domain/Entity/Project";
import { ContactOwnerModal } from "@/shared/components/ContactOwnerModal";
import { formatBoolean, formatDate } from "@/shared/constants";

export interface ProjectRowProps {
  project: Project;
  onProjectEdit: (project: Project) => void;
  onProjectDelete: (project: Project) => void;
}

export const ProjectRowComponent: FC<ProjectRowProps> = ({
  project,
  onProjectEdit,
  onProjectDelete,
}) => {
  const [show, setShow] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <tr key={project.id}>
        <td style={{ whiteSpace: "wrap" }}>{project.name}</td>

        <td
          title={project.description}
          aria-label={project.description}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {project.description}
        </td>

        <td
          title={project.author}
          aria-label={project.author}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {project.author}
        </td>

        <td
          title={project.source}
          aria-label={project.source}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "150px",
          }}
        >
          {project.source}
        </td>

        <td>{project.date && formatDate(project.date)}</td>

        <td>{formatBoolean(project.template, "Public", "Private")}</td>

        <td>{project.isDeleted ? "Deleted" : "Active"}</td>

        <td>
          <ButtonGroup size="sm">
            <Button
              variant="primary"
              onClick={() => onProjectEdit(project)}
              title="Edit project"
            >
              <PencilFill />
            </Button>

            <Button
              variant="danger"
              onClick={() => onProjectDelete(project)}
              title="Delete project"
            >
              <TrashFill />
            </Button>

            <Button
              size="sm"
              variant="info"
              onClick={() => setShow((isShown) => !isShown)}
              title="Show/Hide project details"
            >
              {!show ? <PlusCircle /> : <DashCircle />}
            </Button>
          </ButtonGroup>
        </td>
      </tr>

      {show && (
        <tr>
          <td colSpan={8}>
            <ProjectDetails
              project={project}
              onContactClick={() => setShowContactModal(true)}
            />
          </td>
        </tr>
      )}

      {showContactModal && (
        <ContactOwnerModal
          show={showContactModal}
          onClose={() => setShowContactModal(false)}
          owners={project.owners || []}
          entityName={project.name || ""}
          entityType="Project"
        />
      )}
    </>
  );
};

interface ProjectDetailsProps {
  project: Project;
  onContactClick: () => void;
}

const ProjectDetails: FC<ProjectDetailsProps> = ({
  project,
  onContactClick,
}) => {
  const productLines = project?.project?.productLines || [];
  return (
    <Container className="p-2">
      <Row className="align-items-center mb-3">
        <Col xs={2} className="fw-bold">
          Owners
        </Col>
        <Col xs={6}>
          {(project.owners || [])
            .map((owner) => `${owner.name || "N/A"} (${owner.email})`)
            .join(", ") || "No owners registered"}
        </Col>
        <Col xs={4} className="text-end">
          {project.owners && project.owners.length > 0 && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={onContactClick}
              title="Contact Project Owners"
            >
              <EnvelopeFill className="me-1" /> Contact Owners
            </Button>
          )}
        </Col>
      </Row>

      {!productLines.length ? (
        <div>No product lines registered</div>
      ) : (
        <Accordion alwaysOpen flush>
          {productLines.map((productLine) => (
            <Accordion.Item key={productLine.id} eventKey={`${productLine.id}`}>
              <Accordion.Header>
                Product Line: {productLine.name} - Type: {productLine.type} -
                Domain: {productLine.domain}
              </Accordion.Header>

              <Accordion.Body>
                <Accordion alwaysOpen flush>
                  <Accordion.Item
                    key={`${productLine.id}-domainEngineering`}
                    eventKey={`${productLine.id}-domainEngineering`}
                  >
                    <Accordion.Header>
                      Domain Engineering - Models
                    </Accordion.Header>
                    <Accordion.Body>
                      <div
                        className="d-grid gap-1"
                        style={{
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                        }}
                      >
                        {productLine.domainEngineering?.models?.map?.(
                          (model) => (
                            <div key={model.id}>{model.name}</div>
                          ),
                        )}

                        {!productLine.domainEngineering?.models?.length &&
                          "There are no domain engineering models in this product line."}
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item
                    key={`${productLine.id}-applicationEngineering`}
                    eventKey={`${productLine.id}-applicationEngineering`}
                  >
                    <Accordion.Header>
                      Application Engineering - Models
                    </Accordion.Header>
                    <Accordion.Body>
                      <div
                        className="d-grid gap-1"
                        style={{
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                        }}
                      >
                        {productLine.applicationEngineering?.models?.map?.(
                          (model) => (
                            <div key={model.id}>{model.name}</div>
                          ),
                        )}

                        {!productLine.applicationEngineering?.models?.length &&
                          "There are no application engineering models in this product line."}
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Container>
  );
};
