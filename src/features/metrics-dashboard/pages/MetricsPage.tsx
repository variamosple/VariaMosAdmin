import { withPageVisit } from "@variamosple/variamos-components";
import { type FC, useCallback, useEffect, useState } from "react";
import { Container, Row, Spinner } from "react-bootstrap";
import { queryMetrics } from "../api/MetricsRepository";
import { ChartComponent } from "../components/Chart";
import type { Metric } from "../domain/Entity/Metric";

const MetricsPageComponent: FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getMetrics = useCallback(() => {
    setIsLoading(true);
    queryMetrics()
      .then((response) => {
        setMetrics(response.data || []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    getMetrics();
  }, [getMetrics]);

  if (isLoading) {
    return (
      <Container fluid="sm" className="my-2">
        <div className="w-100 text-center my-3">
          <Spinner animation="border" variant="primary" />
        </div>
      </Container>
    );
  }

  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">Metrics</h1>

      <hr />

      <Row>
        {metrics.map((metric) => (
          <ChartComponent key={metric.title} metric={metric} />
        ))}
      </Row>
    </Container>
  );
};

export const MetricsPage = withPageVisit(MetricsPageComponent, "Metrics");
