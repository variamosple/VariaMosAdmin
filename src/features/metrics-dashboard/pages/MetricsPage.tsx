import { withPageVisit } from "@variamosple/variamos-components";
import { type FC, useCallback, useEffect, useId, useState } from "react";
import { Alert, Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useTimeZone } from "@/shared/hooks/useTimeZone";
import { queryMetrics } from "../api/MetricsRepository";
import { GeoChart } from "../components/GeoChart";
import { HourGridChart } from "../components/HourGridChart";
import { KeyFigures } from "../components/KeyFigures";
import { PeriodPicker } from "../components/PeriodPicker";
import { RankingChart } from "../components/RankingChart";
import { TimeSeriesChart } from "../components/TimeSeriesChart";
import {
  type ChartPeriod,
  lastDays,
  periodStep,
} from "../domain/Entity/ChartPeriod";
import { dayLabel } from "../domain/Entity/formatFigures";
import { keyFiguresOf, type Metric } from "../domain/Entity/Metric";

const DEFAULT_PRESET = "30d";
const STEP_TEXT = { day: "by day", week: "by week", month: "by month" };

// A chart of the page, by its type; the key figures are drawn apart
const ChartOf: FC<{ metric: Metric; period: ChartPeriod }> = ({
  metric,
  period,
}) => {
  if (metric.chartType === "line" || metric.chartType === "bar") {
    return <TimeSeriesChart metric={metric} step={periodStep(period)} />;
  }
  if (metric.chartType === "ranking") return <RankingChart metric={metric} />;
  if (metric.chartType === "geo") return <GeoChart metric={metric} />;
  if (metric.chartType === "heatmap") return <HourGridChart metric={metric} />;
  return null;
};

const MetricsPageComponent: FC = () => {
  usePageTitle("Metrics");
  const sectionId = useId();
  // The zone chosen in "My account", else the browser's
  const { timeZone } = useTimeZone();
  const [period, setPeriod] = useState<ChartPeriod>(() => lastDays(30));
  const [preset, setPreset] = useState<string | null>(DEFAULT_PRESET);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const load = useCallback((chosen: ChartPeriod, zone: string) => {
    setIsLoading(true);
    setProblem(null);
    return queryMetrics(chosen, zone)
      .then((response) => {
        if (response.errorCode) {
          setProblem(response.message || "The statistics could not be read.");
          return;
        }
        setMetrics(response.data ?? []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    void load(period, timeZone);
  }, [load, period, timeZone]);

  const overview = metrics.find((metric) => metric.id === "overview");
  const content = metrics.find((metric) => metric.id === "content_overview");
  const charts = metrics.filter((metric) => metric.chartType !== "kpi");

  return (
    <Container fluid="lg" className="my-2">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h1 className="mb-0">Metrics</h1>
        <PeriodPicker
          period={period}
          preset={preset}
          isLoading={isLoading}
          onChange={(chosen, chosenPreset) => {
            setPreset(chosenPreset);
            setPeriod(chosen);
          }}
        />
      </div>
      <div className="text-muted" aria-live="polite">
        {dayLabel(period.fromDate)} – {dayLabel(period.toDate)},{" "}
        {STEP_TEXT[periodStep(period)]}
        {isLoading ? (
          <Spinner
            animation="border"
            size="sm"
            className="ms-2"
            role="status"
            aria-label="Loading"
          />
        ) : null}
      </div>

      <hr />

      {problem ? (
        <Alert variant="danger" className="d-flex align-items-center gap-3">
          <span>{problem}</span>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => load(period, timeZone)}
          >
            Retry
          </Button>
        </Alert>
      ) : null}

      {isLoading && metrics.length === 0 ? (
        <div className="w-100 text-center my-3">
          <Spinner
            data-testid="loading-spinner"
            animation="border"
            variant="primary"
          />
        </div>
      ) : null}

      {overview ? (
        <section
          aria-labelledby={`${sectionId}-period-figures`}
          className="mb-4"
        >
          <h2 id={`${sectionId}-period-figures`} className="fs-4">
            Over the period
          </h2>
          <KeyFigures figures={keyFiguresOf(overview)} withChange />
        </section>
      ) : null}

      {content ? (
        <section
          aria-labelledby={`${sectionId}-content-figures`}
          className="mb-4"
        >
          <h2 id={`${sectionId}-content-figures`} className="fs-4">
            {content.title}
          </h2>
          <KeyFigures figures={keyFiguresOf(content)} withChange={false} />
        </section>
      ) : null}

      {charts.length > 0 ? (
        <section aria-labelledby={`${sectionId}-charts`}>
          <h2 id={`${sectionId}-charts`} className="fs-4">
            Charts
          </h2>
          <Row className="g-3">
            {charts.map((metric) => (
              <Col
                key={metric.id}
                xs={12}
                lg={metric.chartType === "line" ? 12 : 6}
              >
                <ChartOf metric={metric} period={period} />
              </Col>
            ))}
          </Row>
        </section>
      ) : null}
    </Container>
  );
};

export const MetricsPage = withPageVisit(MetricsPageComponent, "Metrics");
