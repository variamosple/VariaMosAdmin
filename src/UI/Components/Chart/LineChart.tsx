import { Metric } from "@/Domain/Metric/Metric";
import { useLineChartData } from "@/UI/Hooks/useLineChartData";
import { FC } from "react";
import { Chart } from "react-google-charts";

export interface LineChartProps {
  metric: Metric;
}

export const LineChart: FC<LineChartProps> = ({ metric }) => {
  const { data, options } = useLineChartData(metric);

  return (
    <div className="d-flex flex-column align-items-center col-12 col-md-6">
      <h2 className="fs-5 text-center mt-5">{metric.title}</h2>

      <div className="w-100">
        <Chart
          chartType="LineChart"
          width="100%"
          height={"350px"}
          data={data}
          loader={<div>Loading Chart...</div>}
          options={options}
        />
      </div>
    </div>
  );
};
