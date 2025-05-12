import { watchMicroserviceLogs } from "@/DataProviders/MicroServiceRepository";
import { MicroService } from "@/Domain/MicroService/MicroService";
import { formatDateTime } from "@/UI/constants";
import { useLineBuffer } from "@/UI/Hooks/useLineBuffer";
import { useSocket } from "@/UI/Hooks/useSocket";
import "@patternfly/react-core/dist/styles/base-no-reset.css";
import { LogViewer } from "@patternfly/react-log-viewer";
import { FC, useEffect, useState } from "react";
import { Button, ButtonGroup, Spinner } from "react-bootstrap";
import {
  ArrowClockwise,
  DashCircle,
  PlayFill,
  Search,
  StopFill,
} from "react-bootstrap-icons";

export interface MicroServiceRowProps {
  microService: MicroService;
  onMicroServiceStart: (microservice: MicroService) => void;
  onMicroServiceRestart: (microservice: MicroService) => void;
  onMicroServiceStop: (microservice: MicroService) => void;
}

export const MicroServiceRowComponent: FC<MicroServiceRowProps> = ({
  microService,
  onMicroServiceStart,
  onMicroServiceRestart,
  onMicroServiceStop,
}) => {
  const [show, setShow] = useState(false);
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
      const socket = connect();

      if (!socket) {
        return;
      }

      socket.onopen = () => {
        console.log("WebSocket connection established");
        socket.send(JSON.stringify({ microserviceId: microService.id }));
      };

      socket.onmessage = (event) => {
        setIsLoading(false);
        addToLogsBuffer(event.data);
      };

      socket.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [microService.id, show, isLoaded, isLoading, addToLogsBuffer, connect]);

  useEffect(() => {
    if (socket && !show) {
      socket.close();
    }
  }, [show, socket]);

  return (
    <>
      <tr key={microService.id}>
        <td className="word-break-all">{microService.id}</td>

        <td className="word-break-all">{microService.names.join(", ")}</td>

        <td>{microService.state}</td>

        <td>{microService.status}</td>

        <td>
          {microService.created
            ? formatDateTime(new Date(microService.created))
            : null}
        </td>

        <td className="text-center">
          <ButtonGroup size="sm">
            {microService.state === "exited" && (
              <Button
                variant="success"
                onClick={() => onMicroServiceStart(microService)}
                title="Start Microservice"
              >
                <PlayFill />
              </Button>
            )}

            {microService.state === "running" && (
              <Button
                variant="warning"
                onClick={() => onMicroServiceRestart(microService)}
                title="Restart Microservice"
              >
                <ArrowClockwise />
              </Button>
            )}

            {microService.state === "running" && (
              <Button
                variant="danger"
                onClick={() => onMicroServiceStop(microService)}
                title="Stop Microservice"
              >
                <StopFill />
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => setShow((isShown) => !isShown)}
              title="Show/Hide logs"
            >
              {!show ? <Search /> : <DashCircle />}
            </Button>
          </ButtonGroup>
        </td>
      </tr>

      {show && isLoading && (
        <tr>
          <td colSpan={8}>
            <div className="w-100 text-center my-3">
              <Spinner animation="border" variant="primary" />
            </div>
          </td>
        </tr>
      )}

      {show && (
        <tr>
          <td colSpan={6}>
            <MicroServiceLogs isLoading={isLoading} logs={logs} />
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

export const MicroServiceLogs: FC<MicroServiceLogsProps> = ({
  isLoading,
  logs,
}) => {
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
