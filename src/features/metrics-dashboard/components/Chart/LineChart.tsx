import type { FC } from "react";
import { Spinner } from "react-bootstrap";
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
import { ChartDateFilter } from "./ChartDateFilter";

const LineChartComponent: FC = () => {
  const { metric, isLoading } = useChartContext();
  const { data: rawData } = useLineChartData(metric);

  // Transform rawData [ ["Date", "Series1", "Series2"], [DateObj, val1, val2] ] into Recharts format:
  // [ { date: "10/12", Series1: val1, Series2: val2 } ]
  const chartData = (() => {
    if (!rawData || rawData.length <= 1) return [];
    const headers = rawData[0]; // ["Date", ...seriesKeys]
    const rows = rawData.slice(1);
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
          item[key] = val as string | number;
        }
      });
      return item;
    });
  })();

  const seriesKeys = (() => {
    if (!rawData || rawData.length === 0) return [];
    return rawData[0].filter((h) => h !== "Date");
  })();

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
        )}
      </div>
    </div>
  );
};

export const LineChart = withChartContextWrapper(LineChartComponent);
