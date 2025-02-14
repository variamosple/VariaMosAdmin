import { useLineChartData } from "@/UI/Hooks/useLineChartData";
import { FC } from "react";

import {
  useChartContext,
  withChartContextWrapper,
} from "@/UI/Context/ChartContext";
import { Spinner } from "react-bootstrap";
import Chart from "react-google-charts";
import { ChartDateFilter } from "./ChartDateFilter";

const LineChartComponent: FC<unknown> = () => {
  const { metric, isLoading } = useChartContext();
  const { data, options } = useLineChartData(metric);

  return (
    <div className="d-flex flex-column align-items-center col-12 col-lg-6 mb-4">
      <div className="d-flex justify-content-between align-items-center my-2 w-100">
        <h2 className="fs-4 my-0 text-center">{metric.title}</h2>

        <ChartDateFilter id={metric.title} />
      </div>

      <div
        className="d-flex justify-content-center align-items-center w-100"
        style={{ height: "350px" }}
      >
        {isLoading && (
          <Spinner className="mt-5" animation="border" variant="primary" />
        )}

        {!isLoading && !metric.data && (
          <span className="text-muted">No data found.</span>
        )}

        {!isLoading && metric.data && (
          <Chart
            chartType="LineChart"
            width="100%"
            height={"350px"}
            data={data}
            loader={<div>Loading Chart...</div>}
            options={options}
          />
        )}
      </div>
    </div>
  );
};

export const LineChart = withChartContextWrapper(LineChartComponent);
