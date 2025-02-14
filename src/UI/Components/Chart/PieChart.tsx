import { Metric } from "@/Domain/Metric/Metric";
import { useChart } from "@/UI/Hooks/useChart";
import { FC } from "react";
import { Chart } from "react-google-charts";

export interface PieChartProps {
  metric: Metric;
}

export const PieChart: FC<PieChartProps> = ({ metric }) => {
  const { data, options } = useChart(metric);

  return (
    <div className="d-flex flex-column align-items-center col-12 col-lg-6 mb-4">
      <h2 className="fs-4 text-center my-2">{metric.title}</h2>

      <div className="w-100">
        <Chart
          chartType="PieChart"
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
