import { useLineBuffer } from "@/shared/hooks/useLineBuffer";
import { useSocket } from "@/shared/hooks/useSocket";
import { watchMicroserviceLogs } from "../../api/MicroServiceRepository";
import type { FollowUp, FollowUpStep } from "../../domain/actionFollowUp";
import type {
  HealthStatus,
  MicroService,
} from "../../domain/Entity/MicroService";
import { formatBytes, serviceResourcesOf } from "../../domain/serviceResources";
import { UptimeBar } from "../UptimeBar";
import "@patternfly/react-core/dist/styles/base-no-reset.css";
import { LogViewer } from "@patternfly/react-log-viewer";
import { type FC, useEffect, useState } from "react";
import { Badge, ButtonGroup, Spinner } from "react-bootstrap";
import {
  ArrowClockwise,
  DashCircle,
  Megaphone,
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
  // Given to whoever may send announcements (EV-86, MA-NO-05)
  onMicroServiceAnnounce?: (microservice: MicroService) => void;
  // A start, restart or stop under way, or one that failed (EV-86 lot 3)
  followUp?: FollowUp;
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

const FOLLOW_UP_BADGES: Record<
  FollowUpStep,
  { bg: string; text?: "dark"; label: string }
> = {
  starting: { bg: "info", text: "dark", label: "STARTING" },
  restarting: { bg: "info", text: "dark", label: "RESTARTING" },
  stopping: { bg: "info", text: "dark", label: "STOPPING" },
  failed: { bg: "danger", label: "NOT BACK" },
};

// The health check, or the container state when there is none
const statusOf = (microService: MicroService): HealthStatus =>
  microService.health?.status ||
  (microService.state === "running" ? "UP" : "DOWN");

// Actions follow the container, not the health check: a running service
// that answers badly, or was never checked, can be restarted or stopped
const isRunningOf = (microService: MicroService, isUp: boolean) =>
  microService.containers?.length
    ? microService.containers.some((c) => c.state === "running")
    : microService.state === "running" || isUp;

const portOf = (targetUrl?: string): string => {
  if (!targetUrl) return "—";
  try {
    return new URL(targetUrl).port || "80";
  } catch {
    return "—";
  }
};

const containerCountOf = (microService: MicroService, isRunning: boolean) =>
  microService.replicasCount ??
  (microService.containers?.length || (isRunning ? 1 : 0));

// The logs of the service, followed while they are shown
const useServiceLogs = (microService: MicroService, show: boolean) => {
  const { buffer: logs, addToBuffer: addToLogsBuffer } = useLineBuffer(40960);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const { connect, socket } = useSocket(watchMicroserviceLogs, false);

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

  return { logs, isLoading };
};

type ServiceActionsProps = Omit<MicroServiceRowProps, "followUp"> & {
  isRunning: boolean;
  isBusy: boolean;
  showLogs: boolean;
  onToggleLogs: () => void;
};

const ServiceActions: FC<ServiceActionsProps> = (props) => {
  const { microService, isRunning, isBusy, showLogs } = props;
  return (
    <ButtonGroup size="sm">
      {!isRunning && (
        <IconButton
          variant="success"
          onClick={() => props.onMicroServiceStart(microService)}
          label="Start Service"
          disabled={isBusy}
          icon={<PlayFill />}
        />
      )}

      {isRunning ? (
        <>
          <IconButton
            variant="warning"
            onClick={() => props.onMicroServiceRestart(microService)}
            label="Restart Service"
            disabled={isBusy}
            icon={<ArrowClockwise />}
          />

          <IconButton
            variant="danger"
            onClick={() => props.onMicroServiceStop(microService)}
            label="Stop Service"
            disabled={isBusy}
            icon={<StopFill />}
          />
        </>
      ) : null}

      {props.onMicroServiceAnnounce ? (
        <IconButton
          variant="outline-secondary"
          onClick={() => props.onMicroServiceAnnounce?.(microService)}
          label="Announce maintenance"
          icon={<Megaphone size={14} />}
        />
      ) : null}

      <IconButton
        variant="outline-secondary"
        onClick={() => props.onMicroServiceConfigure?.(microService)}
        label="Configure service parameters"
        icon={<Sliders size={14} />}
      />

      <IconButton
        variant="outline-secondary"
        size="sm"
        onClick={props.onToggleLogs}
        label="Show/Hide logs"
        icon={showLogs ? <DashCircle size={14} /> : <Search size={14} />}
      />
    </ButtonGroup>
  );
};

const ServiceName: FC<{ microService: MicroService }> = ({ microService }) => (
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
);

const UptimeCell: FC<{ microService: MicroService }> = ({ microService }) => {
  const hasUptime = Boolean(microService.uptimeSummary?.history?.length);
  return (
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
  );
};

// CPU and memory of the running containers, sampled every 30 s (EV-86 lot 2)
const ResourceCells: FC<{ microService: MicroService }> = ({
  microService,
}) => {
  const resources = serviceResourcesOf(microService);
  const cpu = resources?.cpuPercent;
  const limit = resources?.memoryLimitBytes;
  return (
    <>
      <td
        title={
          resources && cpu === null
            ? "Measured from the second sample, 30 s after the start"
            : "Average over the last 30 s; 100 % is one full core"
        }
      >
        {typeof cpu === "number" ? `${cpu} %` : "—"}
      </td>
      <td>
        {resources ? (
          <span className="small">
            {formatBytes(resources.memoryUsedBytes)}
            {typeof limit === "number" && limit > 0 ? (
              <span className="text-muted"> / {formatBytes(limit)}</span>
            ) : null}
          </span>
        ) : (
          "—"
        )}
      </td>
    </>
  );
};

// The logs under the row: a spinner until the first line comes
const LogsRow: FC<{ isLoading: boolean; logs: string }> = ({
  isLoading,
  logs,
}) =>
  isLoading ? (
    <tr>
      <td colSpan={9}>
        <div className="w-100 text-center my-3">
          <Spinner animation="border" variant="primary" />
        </div>
      </td>
    </tr>
  ) : (
    <tr>
      <td colSpan={9} className="p-0">
        <div className="p-2 bg-dark">
          <MicroServiceLogs isLoading={isLoading} logs={logs} />
        </div>
      </td>
    </tr>
  );

export const MicroServiceRowComponent: FC<MicroServiceRowProps> = (props) => {
  const { microService, followUp } = props;
  const [show, setShow] = useState(false);
  const { logs, isLoading } = useServiceLogs(microService, show);

  const status = statusOf(microService);
  const isUp = status === "UP";
  const isRunning = isRunningOf(microService, isUp);
  const badge = followUp
    ? FOLLOW_UP_BADGES[followUp.step]
    : (STATUS_BADGES[status] ?? STATUS_BADGES.DOWN);
  // No second action on a service while one is under way
  const isBusy = followUp !== undefined && followUp.step !== "failed";
  const port = portOf(microService.targetUrl);
  const containerCount = containerCountOf(microService, isRunning);

  return (
    <>
      <tr>
        <ServiceName microService={microService} />

        <td>
          <Badge
            bg={badge.bg}
            text={badge.text}
            className="text-uppercase d-inline-flex align-items-center gap-1"
          >
            {isBusy ? (
              <Spinner animation="border" size="sm" aria-hidden="true" />
            ) : null}
            {badge.label}
          </Badge>
        </td>

        <td>
          {/* A slow answer is what makes a service DEGRADED: show it */}
          {(isUp || status === "DEGRADED") &&
          microService.health?.responseTimeMs !== undefined
            ? `${microService.health.responseTimeMs} ms`
            : "—"}
        </td>

        <ResourceCells microService={microService} />

        <UptimeCell microService={microService} />

        <td>
          {port === "—" ? (
            <span className="text-muted">—</span>
          ) : (
            <code>{port}</code>
          )}
        </td>

        <td>
          <span className="small">
            {containerCount} {containerCount === 1 ? "container" : "containers"}
          </span>
        </td>

        <td className="text-center">
          <ServiceActions
            {...props}
            isRunning={isRunning}
            isBusy={isBusy}
            showLogs={show}
            onToggleLogs={() => setShow((isShown) => !isShown)}
          />
        </td>
      </tr>

      {show ? <LogsRow isLoading={isLoading} logs={logs} /> : null}
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
