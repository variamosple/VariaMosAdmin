import { Language } from "@/Domain/Language/Language";
import { formatDate, formatDateTime } from "@/UI/constants";
import { FC, useMemo, useState } from "react";
import { Button, ButtonGroup, Col, Container, Row } from "react-bootstrap";
import {
  DashCircle,
  PencilFill,
  PlusCircle,
  TrashFill,
} from "react-bootstrap-icons";

export interface LanguageRowProps {
  language: Language;
  onLanguageEdit: (language: Language) => void;
  onLanguageDelete: (language: Language) => void;
}

export const LanguageRowComponent: FC<LanguageRowProps> = ({
  language,
  onLanguageEdit,
  onLanguageDelete,
}) => {
  const [show, setShow] = useState(false);
  const owner = useMemo(() => {
    if (!language.owners) return null;

    return language.owners?.find((owner) => owner.accessLevel === "OWNER");
  }, [language.owners]);

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

        <td>{formatDate(new Date(language.createdAt!))}</td>

        <td>{formatDateTime(new Date(language.updatedAt!))}</td>

        <td>
          <ButtonGroup size="sm">
            <Button
              variant="primary"
              onClick={() => onLanguageEdit(language)}
              title="Edit language"
            >
              <PencilFill />
            </Button>

            <Button
              variant="danger"
              onClick={() => onLanguageDelete(language)}
              title="Delete language"
            >
              <TrashFill />
            </Button>

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
            <LanguageDetails language={language} />
          </td>
        </tr>
      )}
    </>
  );
};

interface LanguageDetailsProps {
  language: Language;
}

export const LanguageDetails: FC<LanguageDetailsProps> = ({ language }) => {
  return (
    <Container>
      <Row>
        <Col xs={2} className="fw-bold">
          Name
        </Col>

        <Col xs={10}>{language.name}</Col>
      </Row>

      <Row>
        <Col xs={2} className="fw-bold">
          Owners
        </Col>

        <Col xs={10}>
          {(language.owners || [])
            .map((owner) => `${owner.name} (${owner.email})`)
            .join(", ")}
        </Col>
      </Row>
    </Container>
  );
};
