import type { FC } from "react";
import { Spinner } from "react-bootstrap";
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  useChartContext,
  withChartContextWrapper,
} from "../../context/ChartContext";
import { useChart } from "../../hooks/useChart";
import { ChartDateFilter } from "./ChartDateFilter";

// Filtered by period like the line charts (EV-90 lot A.3)
const PieChartComponent: FC = () => {
  const { metric, isLoading } = useChartContext();
  const { data: rawData } = useChart(metric);

  // Transform rawData [ ["Page", "Visits"], ["Home", 10] ] into Recharts format:
  // [ { name: "Home", value: 10 } ]
  const chartData = (() => {
    if (!rawData || rawData.length <= 1) return [];
    return rawData.slice(1).map((row) => ({
      name: String(row[0]),
      value: Number(row[1]),
    }));
  })();

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
  ];

  const isDoughnut = metric.chartType === "doughnut";

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
          <Spinner
            data-testid="loading-spinner"
            className="mt-5"
            animation="border"
            variant="primary"
          />
        )}

        {!isLoading && !metric.data && (
          <span className="text-muted">No data found.</span>
        )}

        {!isLoading && metric.data && (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                innerRadius={isDoughnut ? 60 : 0}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_entry, index) => (
                  <Cell
                    key={`cell-${_entry.name}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export const PieChart = withChartContextWrapper(PieChartComponent);
