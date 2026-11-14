import { type FC, useId, useRef, useState } from "react";
import { Button, ButtonGroup, Overlay, Popover } from "react-bootstrap";
import {
  type ChartPeriod,
  lastDays,
  PERIOD_PRESETS,
} from "../domain/Entity/ChartPeriod";
import { PeriodForm } from "./PeriodForm";

export interface PeriodPickerProps {
  period: ChartPeriod;
  /** The ready-made period chosen, or null for one set by hand. */
  preset: string | null;
  isLoading: boolean;
  onChange: (period: ChartPeriod, preset: string | null) => void;
}

/** The period of the whole page: a ready-made one, or dates, a month, a year. */
export const PeriodPicker: FC<PeriodPickerProps> = ({
  period,
  preset,
  isLoading,
  onChange,
}) => {
  const [showForm, setShowForm] = useState(false);
  const targetRef = useRef(null);
  const popoverId = useId();

  return (
    <>
      <ButtonGroup aria-label="Period" size="sm">
        {PERIOD_PRESETS.map((option) => (
          <Button
            key={option.key}
            variant={preset === option.key ? "primary" : "outline-primary"}
            aria-pressed={preset === option.key}
            onClick={() => onChange(lastDays(option.days), option.key)}
          >
            {option.label}
          </Button>
        ))}
        <Button
          ref={targetRef}
          variant={preset === null ? "primary" : "outline-primary"}
          aria-pressed={preset === null}
          onClick={() => setShowForm((show) => !show)}
        >
          Custom…
        </Button>
      </ButtonGroup>

      <Overlay
        show={showForm}
        onHide={() => setShowForm(false)}
        target={targetRef}
        placement="bottom-end"
        rootClose
      >
        <Popover id={popoverId} style={{ maxWidth: "370px" }}>
          <Popover.Header as="h3">Period</Popover.Header>
          <Popover.Body>
            <PeriodForm
              period={period}
              isLoading={isLoading}
              onSubmit={(chosen) => {
                setShowForm(false);
                onChange(chosen, null);
              }}
            />
          </Popover.Body>
        </Popover>
      </Overlay>
    </>
  );
};
