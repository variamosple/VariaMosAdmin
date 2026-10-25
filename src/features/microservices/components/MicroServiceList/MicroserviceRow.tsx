import { useLineBuffer } from "@/shared/hooks/useLineBuffer";
import { useSocket } from "@/shared/hooks/useSocket";
import { watchMicroserviceLogs } from "../../api/MicroServiceRepository";
import type {
  HealthStatus,
  MicroService,
} from "../../domain/Entity/MicroService";
import { UptimeBar } from "../UptimeBar";
import "@patternfly/react-core/dist/styles/base-no-reset.css";
import { LogViewer } from "@patternfly/react-log-viewer";
import { type FC, useEffect, useState } from "react";
import { Badge, ButtonGroup, Spinner } from "react-bootstrap";
import {
  ArrowClockwise,
  DashCircle,
  PlayFill,
  Search,
  Sliders,
  StopFill,
} from "react-bootstrap-icons";
import { IconButton } from "@/shared/components/IconButton";

export interface MicroServiceRowProps {
  microService: MicroService;
  onMicroServiceStart: (microservice: MicroService) => void;
  onMicroServiceRestart: (microservice: MicroService) => void;
  onMicroServiceStop: (microservice: MicroService) => void;
  onMicroServiceConfigure?: (microservice: MicroService) => void;
}

const STATUS_BADGES: Record<
  HealthStatus,
  { bg: string; text?: "dark"; label: string }
> = {
  UP: { bg: "success", label: "UP" },
  DEGRADED: { bg: "warning", text: "dark", label: "DEGRADED" },
  DOWN: { bg: "danger", label: "DOWN" },
  // Never checked: neither up nor down (EV-106)
  NO_DATA: { bg: "secondary", label: "NO DATA" },
};

export const MicroServiceRowComponent: FC<MicroServiceRowProps> = ({
  microService,
  onMicroServiceStart,
  onMicroServiceRestart,
  onMicroServiceStop,
  onMicroServiceConfigure,
}) => {
  const [show, setShow] = useState(false);
  const { buffer: logs, addToBuffer: addToLogsBuffer } = useLineBuffer(40960);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const { connect, socket } = useSocket(watchMicroserviceLogs, false);

  const status =
    microService.health?.status ||
    (microService.state === "running" ? "UP" : "DOWN");
  const isUp = status === "UP";
  // Actions follow the container, not the health check: a running service
  // that answers badly, or was never checked, can be restarted or stopped
  const isRunning = microService.containers?.length
    ? microService.containers.some((c) => c.state === "running")
    : microService.state === "running" || isUp;
  const badge = STATUS_BADGES[status] ?? STATUS_BADGES.DOWN;
  const hasUptime = !!microService.uptimeSummary?.history?.length;

  let port = "—";
  if (microService.targetUrl) {
    try {
      port = new URL(microService.targetUrl).port || "80";
    } catch {
      port = "—";
    }
  }

  const containerCount =
    microService.replicasCount ??
    (microService.containers?.length || (isRunning ? 1 : 0));

  useEffect(() => {
    if (!show) {
      setIsLoaded(false);
      setIsLoading(false);
    }

    if (!show || isLoaded || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      const socketInstance = connect();

      if (!socketInstance) {
        return;
      }

      socketInstance.onopen = () => {
        const targetId =
          microService.id ||
          microService.containers?.[0]?.id ||
          microService.serviceName;
        socketInstance.send(JSON.stringify({ microserviceId: targetId }));
      };

      socketInstance.onmessage = (event) => {
        setIsLoading(false);
        addToLogsBuffer(event.data);
      };

      socketInstance.onclose = (_event) => {
        // WebSocket connection closed
      };

      socketInstance.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [
    microService.id,
    microService.containers,
    microService.serviceName,
    show,
    isLoaded,
    isLoading,
    addToLogsBuffer,
    connect,
  ]);

  useEffect(() => {
    if (socket && !show) {
      socket.close();
    }
  }, [show, socket]);

  return (
    <>
      <tr>
        <td>
          <div className="fw-semibold">
            {microService.displayName || microService.serviceName}
          </div>
          {microService.serviceName &&
            microService.displayName &&
            microService.serviceName !== microService.displayName && (
              <small className="text-muted">{microService.serviceName}</small>
            )}
        </td>

        <td>
          <Badge bg={badge.bg} text={badge.text} className="text-uppercase">
            {badge.label}
          </Badge>
        </td>

        <td>
          {isUp && microService.health?.responseTimeMs !== undefined
            ? `${microService.health.responseTimeMs} ms`
            : "—"}
        </td>

        <td style={{ minWidth: "120px" }}>
          <div className="small fw-semibold mb-1">
            {hasUptime && microService.uptimeSummary
              ? `${microService.uptimeSummary.uptime30dPercentage.toFixed(1)}%`
              : "—"}
          </div>
          <UptimeBar
            compact
            history={microService.uptimeSummary?.history}
            uptimePercentage={
              microService.uptimeSummary?.uptime30dPercentage ?? 100
            }
            days={30}
          />
        </td>

        <td>
          {port !== "—" ? (
            <code>{port}</code>
          ) : (
            <span className="text-muted">—</span>
          )}
        </td>

        <td>
          <span className="small">
            {containerCount} {containerCount === 1 ? "container" : "containers"}
          </span>
        </td>

        <td className="text-center">
          <ButtonGroup size="sm">
            {!isRunning && (
              <IconButton
                variant="success"
                onClick={() => onMicroServiceStart(microService)}
                label="Start Service"
                icon={<PlayFill />}
              />
            )}

            {isRunning && (
              <>
                <IconButton
                  variant="warning"
                  onClick={() => onMicroServiceRestart(microService)}
                  label="Restart Service"
                  icon={<ArrowClockwise />}
                />

                <IconButton
                  variant="danger"
                  onClick={() => onMicroServiceStop(microService)}
                  label="Stop Service"
                  icon={<StopFill />}
                />
              </>
            )}

            <IconButton
              variant="outline-secondary"
              onClick={() => onMicroServiceConfigure?.(microService)}
              label="Configure service parameters"
              icon={<Sliders size={14} />}
            />

            <IconButton
              variant="outline-secondary"
              size="sm"
              onClick={() => setShow((isShown) => !isShown)}
              label="Show/Hide logs"
              icon={!show ? <Search size={14} /> : <DashCircle size={14} />}
            />
          </ButtonGroup>
        </td>
      </tr>

      {show && isLoading && (
        <tr>
          <td colSpan={7}>
            <div className="w-100 text-center my-3">
              <Spinner animation="border" variant="primary" />
            </div>
          </td>
        </tr>
      )}

      {show && !isLoading && (
        <tr>
          <td colSpan={7} className="p-0">
            <div className="p-2 bg-dark">
              <MicroServiceLogs isLoading={isLoading} logs={logs} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

interface MicroServiceLogsProps {
  isLoading: boolean;
  logs: string;
}

const MicroServiceLogs: FC<MicroServiceLogsProps> = ({ isLoading, logs }) => {
  if (isLoading) {
    return (
      <div className="w-100 text-center my-3">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!logs?.length) {
    return <div>No logs found</div>;
  }

  return (
    <LogViewer hasLineNumbers={true} height={300} data={logs} theme="dark" />
  );
};
