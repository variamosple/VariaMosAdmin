import { queryMetrics } from "@/DataProviders/MetricsRepository";
import { Metric } from "@/Domain/Metric/Metric";
import { withPageVisit } from "@variamosple/variamos-components";
import { FC, useEffect, useState } from "react";
import { Container, Row, Spinner } from "react-bootstrap";
import { ChartComponent } from "../Components/Chart";

const MetricsPageComponent: FC<unknown> = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getMetrics = () => {
    setIsLoading(true);
    queryMetrics()
      .then((response) => {
        setMetrics(response.data || []);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getMetrics();
  }, []);

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
