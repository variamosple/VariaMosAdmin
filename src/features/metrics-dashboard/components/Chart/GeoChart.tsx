import type { FC } from "react";
import { ButtonGroup, ToggleButton } from "react-bootstrap";
import { type ISOCode, WorldMap } from "react-svg-worldmap";
import type { Metric } from "../../domain/Entity/Metric";
import { useGeoChartData } from "../../hooks/useGeoChartData";

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
        const countryInput = String(rawCountry).trim();
        if (countryInput.length === 2) {
          resultList.push({
            country: countryInput.toLowerCase() as ISOCode,
            value: Number(row[1]),
          });
        }
      }
    }
    return resultList;
  })();

  return (
    <div className="d-flex flex-column align-items-center w-100 mb-4">
      <div className="d-flex justify-content-between align-items-center my-2 mx-3 w-100">
        <h1 className="fs-4 m-0 w-auto">
          {metric.title} - {activeFilter}
        </h1>

        <ButtonGroup>
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

      <div className="col-12 d-flex justify-content-center">
        <WorldMap
          color="#1C5C9E"
          title=""
          value-suffix=" visits"
          size="xxl"
          data={chartData}
        />
      </div>
    </div>
  );
};
