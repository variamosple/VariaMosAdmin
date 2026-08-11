import type { FC } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Metric } from "../../domain/Entity/Metric";
import { useChart } from "../../hooks/useChart";

export interface PieChartProps {
  metric: Metric;
}

export const PieChart: FC<PieChartProps> = ({ metric }) => {
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
      <h2 className="fs-4 text-center my-2">{metric.title}</h2>

      <div className="w-100" style={{ height: "350px" }}>
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
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
