import type { FC } from "react";
import { ButtonGroup, ToggleButton } from "react-bootstrap";
import { type ISOCode, regions, WorldMap } from "react-svg-worldmap";
import type { Metric } from "../domain/Entity/Metric";
import { useGeoChartData } from "../hooks/useGeoChartData";

// The countries the map can draw
const MAP_CODES = new Set(regions.map((region) => region.code.toLowerCase()));

const isMapCode = (code: string): code is Lowercase<ISOCode> =>
  MAP_CODES.has(code);

export interface GeoChartProps {
  metric: Metric;
}

export const GeoChart: FC<GeoChartProps> = ({ metric }) => {
  const {
    activeFilter,
    data: rawData,
    filterOptions,
    setFilter,
  } = useGeoChartData(metric);

  // Transform rawData [ ["Country", "Visits"], ["US", 10] ] into react-svg-worldmap format:
  // [ { country: "us", value: 10 } ]
  const chartData = (() => {
    if (!rawData || rawData.length <= 1) return [];

    const resultList: { country: ISOCode; value: number }[] = [];

    for (const row of rawData.slice(1)) {
      const rawCountry = row[0];
      if (rawCountry !== null && rawCountry !== undefined) {
        const country = String(rawCountry).trim().toLowerCase();
        if (isMapCode(country)) {
          resultList.push({ country, value: Number(row[1]) });
        }
      }
    }
    return resultList;
  })();

  return (
    <section className="border rounded p-3 h-100" aria-label={metric.title}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h3 className="fs-5 m-0">
          {metric.title} - {activeFilter}
        </h3>

        <ButtonGroup size="sm">
          {filterOptions.map((option) => (
            <ToggleButton
              key={option}
              id={`radio-${option}`}
              type="radio"
              variant="outline-primary"
              name="radio"
              value={option}
              checked={activeFilter === option}
              onChange={() => setFilter(option)}
            >
              {option}
            </ToggleButton>
          ))}
        </ButtonGroup>
      </div>

      <p className="text-muted small mb-0">
        Visits by country, every year, whatever the period.
      </p>
      <div className="d-flex justify-content-center">
        <WorldMap
          color="#1C5C9E"
          title=""
          value-suffix=" visits"
          size="responsive"
          data={chartData}
        />
      </div>
    </section>
  );
};
