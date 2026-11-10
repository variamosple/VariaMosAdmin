import { type FC, useRef, useState } from "react";
import { Overlay, Popover } from "react-bootstrap";
import { Funnel } from "react-bootstrap-icons";
import { IconButton } from "@/shared/components/IconButton";
import {
  type ChartDateFormProperties,
  useChartContext,
} from "../../context/ChartContext";
import { ChartDateFilterForm } from "./ChartDateFilterForm";

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
      <IconButton
        ref={ref}
        size="sm"
        variant="outline-primary"
        onClick={() => setShowFilter((show) => !show)}
        label="Filter by date"
        icon={<Funnel />}
      />

      <Overlay
        show={showFilter}
        onHide={() => setShowFilter(false)}
        target={ref}
        placement="bottom"
        rootClose
      >
        <Popover
          id={`metric-popover-filter-${id}`}
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
