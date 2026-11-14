import type { FC } from "react";
import {
  Bar,
  BarChart,
  type BarShapeProps,
  LabelList,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type Metric, rankingOf } from "../domain/Entity/Metric";
import { type PageArea, pageOf } from "../domain/Entity/pageNames";
import { ChartCard } from "./ChartCard";

const AREA_COLORS: Record<PageArea, string> = {
  Languages: "#0d6efd",
  Administration: "#6f42c1",
  Laboratory: "#198754",
  Other: "#6c757d",
};
const BAR_HEIGHT = 28;

export interface RankingChartProps {
  metric: Metric;
}

/** A ranking as horizontal bars, each with its value; pages by area. */
export const RankingChart: FC<RankingChartProps> = ({ metric }) => {
  const isPages = metric.id === "top_visited_pages";
  const rows = rankingOf(metric).map((row) => {
    const page = isPages ? pageOf(row.label) : undefined;
    return {
      name: page?.name ?? row.label,
      count: row.count,
      fill: AREA_COLORS[page?.area ?? "Languages"],
    };
  });
  const areas = isPages
    ? [...new Set(rankingOf(metric).map((row) => pageOf(row.label).area))]
    : [];

  return (
    <ChartCard title={metric.title} isEmpty={rows.length === 0}>
      {areas.length > 1 ? (
        <ul className="list-inline small mb-1">
          {areas.map((area) => (
            <li key={area} className="list-inline-item me-3">
              <span
                aria-hidden="true"
                className="d-inline-block rounded-1 me-1 align-middle"
                style={{ width: 12, height: 12, background: AREA_COLORS[area] }}
              />
              {area}
            </li>
          ))}
        </ul>
      ) : null}
      <ResponsiveContainer width="100%" height={rows.length * BAR_HEIGHT + 24}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 12 }}
            interval={0}
          />
          <Tooltip />
          <Bar
            dataKey="count"
            name="Count"
            isAnimationActive={false}
            shape={(props: BarShapeProps) => (
              <Rectangle {...props} fill={rows[props.index]?.fill} />
            )}
          >
            <LabelList dataKey="count" position="right" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
