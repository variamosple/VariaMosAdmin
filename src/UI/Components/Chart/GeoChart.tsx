import { Metric } from "@/Domain/Metric/Metric";
import { useGeoChartData } from "@/UI/Hooks/useGeoChartData";
import { FC } from "react";
import { ButtonGroup, ToggleButton } from "react-bootstrap";
import { Chart } from "react-google-charts";

export interface GeoChartProps {
  metric: Metric;
}

export const GeoChart: FC<GeoChartProps> = ({ metric }) => {
  const { activeFilter, data, options, filterOptions, setFilter } =
    useGeoChartData(metric);

  return (
    <div className="d-flex flex-column align-items-center w-100">
      <div className="d-flex justify-content-between align-items-center mx-3 w-100">
        <h1 className="fs-4 m-0 w-auto">
          {metric.title} - {activeFilter}
        </h1>

        <ButtonGroup>
          {filterOptions.map((option) => (
            <ToggleButton
              key={option}
              id={`radio-${option}`}
              type="radio"
              variant="outline-secondary"
              name="radio"
              value={option}
              checked={activeFilter === option}
              onChange={(e) => setFilter(option)}
            >
              {option}
            </ToggleButton>
          ))}
        </ButtonGroup>
      </div>

      <div className="col-10">
        <Chart
          chartType="GeoChart"
          width="100%"
          data={data}
          loader={<div>Loading Chart...</div>}
          options={options}
        />
      </div>
    </div>
  );
};
