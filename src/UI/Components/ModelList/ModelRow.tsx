import { Model } from "@/Domain/Model/Model";
import { FC, useState } from "react";
import { Button, ButtonGroup, Col, Container, Row } from "react-bootstrap";
import { DashCircle, PencilFill, PlusCircle } from "react-bootstrap-icons";

export interface ModelRowProps {
  model: Model;
  onModelEdit: (model: Model) => void;
  onModelDelete: (model: Model) => void;
}

export const ModelRowComponent: FC<ModelRowProps> = ({
  model,
  onModelEdit,
  onModelDelete,
}) => {
  const [show, setShow] = useState(false);

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

        <td>
          <ButtonGroup size="sm">
            <Button
              variant="primary"
              onClick={() => onModelEdit(model)}
              title="Edit model"
            >
              <PencilFill />
            </Button>

            {/* <Button
              variant="danger"
              onClick={() => onModelDelete(model)}
              title="Delete model"
            >
              <TrashFill />
            </Button> */}

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
          <td colSpan={7}>
            <ModelDetails model={model} />
          </td>
        </tr>
      )}
    </>
  );
};

interface ModelDetailsProps {
  model: Model;
}

export const ModelDetails: FC<ModelDetailsProps> = ({ model }) => {
  return (
    <Container>
      <Row>
        <Col xs={2} className="fw-bold">
          Name
        </Col>

        <Col xs={10}>{model.name}</Col>
      </Row>
      <Row>
        <Col xs={2} className="fw-bold">
          Author
        </Col>

        <Col xs={10}>{model.author}</Col>
      </Row>
      <Row>
        <Col xs={2} className="fw-bold">
          Description
        </Col>

        <Col xs={10}>{model.description}</Col>
      </Row>
      <Row>
        <Col xs={2} className="fw-bold">
          Source
        </Col>

        <Col xs={10}>{model.source}</Col>
      </Row>
      <Row>
        <Col xs={2} className="fw-bold">
          Project
        </Col>

        <Col xs={10}>{model.projectName}</Col>
      </Row>

      <Row>
        <Col xs={2} className="fw-bold">
          Owners
        </Col>

        <Col xs={10}>
          {(model.owners || [])
            .map((owner) => `${owner.name} (${owner.email})`)
            .join(", ")}
        </Col>
      </Row>
    </Container>
  );
};
