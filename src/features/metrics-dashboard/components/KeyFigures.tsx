import type { FC } from "react";
import { Col, Row } from "react-bootstrap";
import { figureChange, figureText } from "../domain/Entity/formatFigures";
import type { KeyFigure } from "../domain/Entity/Metric";

// For these, more is worse: an increase is shown in red
const MORE_IS_WORSE = new Set(["failed_sign_ins"]);

const changeClass = (key: string, direction: string) => {
  if (direction === "none" || direction === "flat") return "text-muted";
  const good = (direction === "up") !== MORE_IS_WORSE.has(key);
  return good ? "text-success" : "text-danger";
};

export interface KeyFiguresProps {
  figures: KeyFigure[];
  /** Show the change from the period before. */
  withChange: boolean;
}

/** Tiles of key figures, four by row on a wide screen. */
export const KeyFigures: FC<KeyFiguresProps> = ({ figures, withChange }) => (
  <Row xs={2} md={3} xl={4} className="g-3">
    {figures.map((figure) => {
      const change = figureChange(figure);
      return (
        <Col key={figure.key}>
          <div
            className="border rounded p-3 h-100"
            data-testid={`figure-${figure.key}`}
          >
            <div className="text-muted small">{figure.label}</div>
            <div className="fs-3 fw-semibold">
              {figureText(figure.count, figure.unit)}
            </div>
            {withChange ? (
              <div
                className={`small ${changeClass(figure.key, change.direction)}`}
              >
                {change.direction === "none"
                  ? change.text
                  : `${change.text} vs previous period`}
              </div>
            ) : null}
          </div>
        </Col>
      );
    })}
  </Row>
);
