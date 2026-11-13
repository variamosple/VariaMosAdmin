import type { FC } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useChartContext,
  withChartContextWrapper,
} from "../../context/ChartContext";
import { useLineChartData } from "../../hooks/useLineChartData";
import { ChartFrame } from "./ChartFrame";

const LineChartComponent: FC = () => {
  const { metric, isLoading } = useChartContext();
  const { data: rawData } = useLineChartData(metric);

  // Transform rawData [ ["Date", "Series1", "Series2"], [DateObj, val1, val2] ] into Recharts format:
  // [ { date: "10/12", Series1: val1, Series2: val2 } ]
  const chartData = (() => {
    if (!rawData || rawData.length <= 1) return [];
    const [headers = [], ...rows] = rawData; // ["Date", ...seriesKeys]
    return rows.map((row) => {
      const item: Record<string, string | number> = {};
      row.forEach((val, idx) => {
        const key = String(headers[idx]);
        if (key === "Date") {
          // Format date to locale string
          if (val instanceof Date) {
            item.date = val.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
          } else {
            item.date = String(val);
          }
        } else {
          item[key] = val instanceof Date ? String(val) : val;
        }
      });
      return item;
    });
  })();

  const seriesKeys = (rawData?.[0] ?? []).filter((h) => h !== "Date");

  // Use a nice color list for different lines
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#387908",
    "#0088fe",
    "#00c49f",
    "#ffbb28",
  ];

  return (
    <ChartFrame
      title={metric.title}
      isLoading={isLoading}
      hasData={Boolean(metric.data)}
    >
      <div className="w-100 h-100">
        <ResponsiveContainer width="100%" height={350}>
          <RechartsLineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, index) => {
              const keyStr = String(key);
              return (
                <Line
                  key={keyStr}
                  type="monotone"
                  dataKey={keyStr}
                  stroke={colors[index % colors.length]}
                  activeDot={{ r: 8 }}
                />
              );
            })}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
};

export const LineChart = withChartContextWrapper(LineChartComponent);
