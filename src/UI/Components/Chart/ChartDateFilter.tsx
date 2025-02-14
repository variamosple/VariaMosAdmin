import { useChartContext } from "@/UI/Context/ChartContext";
import { FC, useRef, useState } from "react";
import { Button, Overlay, Popover } from "react-bootstrap";
import { Funnel } from "react-bootstrap-icons";
import {
  ChartDateFilterForm,
  ChartDateFormProperties,
} from "./ChartDateFilterForm";

export interface ChartDateFilterProperties {
  id: string;
}

export const ChartDateFilter: FC<ChartDateFilterProperties> = ({ id }) => {
  const [showFilter, setShowFilter] = useState(false);
  const ref = useRef(null);
  const { filterChartData } = useChartContext();

  const handleSubmit = (data: ChartDateFormProperties) => {
    setShowFilter(false);
    filterChartData(data);
  };

  return (
    <>
      <Button
        ref={ref}
        size="sm"
        variant="outline-primary"
        onClick={() => setShowFilter((show) => !show)}
      >
        <Funnel />
      </Button>

      <Overlay
        show={showFilter}
        onHide={() => setShowFilter(false)}
        target={ref}
        placement="bottom"
        rootClose
      >
        <Popover
          id={`metric-popoever-filter-${id}`}
          style={{ maxWidth: "370px" }}
        >
          <Popover.Header as="h3">Filter Chart Data</Popover.Header>
          <Popover.Body>
            <ChartDateFilterForm onFilterSubmit={handleSubmit} />
          </Popover.Body>
        </Popover>
      </Overlay>
    </>
  );
};
