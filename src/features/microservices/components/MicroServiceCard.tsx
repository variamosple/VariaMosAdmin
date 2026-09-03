import { type FC, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Row,
  Spinner,
} from "react-bootstrap";
import {
  ArrowClockwise,
  DashCircle,
  GearFill,
  PlayFill,
  Search,
  Sliders,
  StopFill,
} from "react-bootstrap-icons";
import "@patternfly/react-core/dist/styles/base-no-reset.css";
import { LogViewer } from "@patternfly/react-log-viewer";
import { useLineBuffer } from "@/shared/hooks/useLineBuffer";
import { useSocket } from "@/shared/hooks/useSocket";
import { watchMicroserviceLogs } from "../api/MicroServiceRepository";
import type { MicroService } from "../domain/Entity/MicroService";
import { MicroServiceConfigModal } from "./MicroServiceConfigModal";
import { UptimeBar } from "./UptimeBar";

export interface MicroServiceCardProps {
  microService: MicroService;
  onStart: (microservice: MicroService) => void;
  onRestart: (microservice: MicroService) => void;
  onStop: (microservice: MicroService) => void;
  onScale: (microservice: MicroService, newReplicas: number) => void;
}

export const MicroServiceCard: FC<MicroServiceCardProps> = ({
  microService,
  onStart,
  onRestart,
  onStop,
  onScale,
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { buffer: logs, addToBuffer: addToLogsBuffer } = useLineBuffer(40960);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const { connect, socket } = useSocket(watchMicroserviceLogs, false);

  const status = microService.health?.status || "UP";
  const isUp = status === "UP";
  const isDegraded = status === "DEGRADED";

  const toggleLogs = () => {
    if (!showLogs) {
      setIsLoadingLogs(true);
      const ws = connect();
      if (ws) {
        ws.onopen = () => {
          const containerId =
            microService.containers[0]?.id ||
            microService.id ||
            microService.serviceName;
          ws.send(JSON.stringify({ microserviceId: containerId }));
        };
        ws.onmessage = (event) => {
          setIsLoadingLogs(false);
          addToLogsBuffer(event.data);
        };
        ws.onerror = () => setIsLoadingLogs(false);
      }
    } else {
      if (socket) socket.close();
    }
    setShowLogs(!showLogs);
  };

  return (
    <>
      <Card className="mb-3 shadow-sm border-0 bg-white">
        <Card.Body className="p-3">
          <Row className="align-items-center">
            {/* Identity & Status column */}
            <Col md={4} className="mb-2 mb-md-0">
              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: isUp
                      ? "#198754"
                      : isDegraded
                        ? "#ffc107"
                        : "#dc3545",
                  }}
                />
                <h5 className="mb-0 fw-bold">
                  {microService.displayName || microService.serviceName}
                </h5>
                <Badge
                  bg={isUp ? "success" : isDegraded ? "warning" : "danger"}
                  className="text-uppercase"
                >
                  {status}
                </Badge>
              </div>

              <div className="d-flex align-items-center gap-3 mt-2 small text-muted">
                <span>
                  Port:{" "}
                  <code>
                    {microService.targetUrl
                      ? new URL(microService.targetUrl).port
                      : "N/A"}
                  </code>
                </span>
                <span>
                  Replicas:{" "}
                  <strong>
                    {microService.replicasCount ||
                      microService.containers?.length ||
                      1}
                  </strong>
                </span>
                {microService.health?.responseTimeMs !== undefined && (
                  <span>
                    Latency:{" "}
                    <strong>{microService.health.responseTimeMs} ms</strong>
                  </span>
                )}
              </div>
            </Col>

            {/* Uptime Timeline column (Status Page style) */}
            <Col md={5} className="mb-2 mb-md-0">
              <UptimeBar
                history={microService.uptimeSummary?.history}
                uptimePercentage={
                  microService.uptimeSummary?.uptime30dPercentage ?? 100
                }
                days={30}
              />
            </Col>

            {/* Actions column */}
            <Col md={3} className="text-md-end">
              <ButtonGroup size="sm">
                {!isUp && (
                  <Button
                    variant="outline-success"
                    onClick={() => onStart(microService)}
                    title="Start Service"
                  >
                    <PlayFill size={16} />
                  </Button>
                )}

                {isUp && (
                  <>
                    <Button
                      variant="outline-warning"
                      onClick={() => onRestart(microService)}
                      title="Restart Service"
                    >
                      <ArrowClockwise size={16} />
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={() => onStop(microService)}
                      title="Stop Service"
                    >
                      <StopFill size={16} />
                    </Button>
                  </>
                )}

                <Button
                  variant="outline-secondary"
                  onClick={() =>
                    onScale(microService, (microService.replicasCount || 1) + 1)
                  }
                  title="Scale instances (+1)"
                >
                  <Sliders size={14} /> +
                </Button>

                <Button
                  variant="outline-dark"
                  onClick={() => setShowConfigModal(true)}
                  title="Service Configurations & Audit"
                >
                  <GearFill size={14} />
                </Button>

                <Button
                  variant={showLogs ? "primary" : "outline-primary"}
                  onClick={toggleLogs}
                  title="Show/Hide Live Logs"
                >
                  {showLogs ? <DashCircle size={14} /> : <Search size={14} />}
                </Button>
              </ButtonGroup>
            </Col>
          </Row>

          {/* Section Logs */}
          {showLogs && (
            <div className="mt-3 pt-3 border-top">
              {isLoadingLogs ? (
                <div className="text-center my-3">
                  <Spinner animation="border" variant="primary" size="sm" />
                </div>
              ) : (
                <LogViewer
                  hasLineNumbers={true}
                  height={250}
                  data={logs || "Connecting to log stream..."}
                  theme="dark"
                />
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      <MicroServiceConfigModal
        show={showConfigModal}
        serviceName={microService.serviceName}
        displayName={microService.displayName || microService.serviceName}
        onHide={() => setShowConfigModal(false)}
      />
    </>
  );
};
