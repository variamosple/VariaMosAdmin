import { Project } from "@/Domain/Project/Project";
import { formatBoolean, formatDate } from "@/UI/constants";
import { FC, useState } from "react";
import { Accordion, Button, ButtonGroup } from "react-bootstrap";
import {
  DashCircle,
  PencilFill,
  PlusCircle,
  TrashFill,
} from "react-bootstrap-icons";

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

        <td>{project.date && formatDate(new Date(project.date))}</td>

        <td>{formatBoolean(project.template, "Public", "Private")}</td>

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
          <td colSpan={7}>
            <ProjectDetails project={project} />
          </td>
        </tr>
      )}
    </>
  );
};

interface ProjectDetailsProps {
  project: Project;
}

export const ProjectDetails: FC<ProjectDetailsProps> = ({ project }) => {
  if (!project?.project?.productLines?.length) {
    return <div>No data</div>;
  }

  return (
    <Accordion alwaysOpen flush>
      {project.project.productLines.map((productLine) => (
        <Accordion.Item key={productLine.id} eventKey={`${productLine.id}`}>
          <Accordion.Header>
            Product Line: {productLine.name} - Type: {productLine.type} -
            Domain: {productLine.domain}
          </Accordion.Header>

          <Accordion.Body>
            <Accordion alwaysOpen flush>
              <Accordion.Item
                key={productLine.id}
                eventKey={`${productLine.id}-domainEngineering`}
              >
                <Accordion.Header>Domain Engineering - Models</Accordion.Header>
                <Accordion.Body>
                  <div
                    className="d-grid gap-1"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                    }}
                  >
                    {productLine.domainEngineering?.models?.map?.((model) => (
                      <div key={model.id}>{model.name}</div>
                    ))}

                    {!productLine.domainEngineering?.models?.length &&
                      "There are no domain engineering models in this product line."}
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item
                key={productLine.id}
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
                      )
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
  );
};
