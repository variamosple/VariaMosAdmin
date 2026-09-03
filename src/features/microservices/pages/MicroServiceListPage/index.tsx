import { withPageVisit } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Alert, Button, Container, Form, Spinner } from "react-bootstrap";
import {
  ArrowClockwise,
  CheckCircleFill,
  ExclamationTriangleFill,
  XCircleFill,
} from "react-bootstrap-icons";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { MicroServiceList } from "../../components/MicroServiceList";
import { useMicroServiceList } from "../../hooks/useMicroServiceList";

const MicroServiceListPageComponent: FC = () => {
  const {
    showStart,
    setShowStart,
    showRestart,
    setShowRestart,
    showStop,
    setShowStop,
    toStartMicroService,
    setToStartMicroService,
    toRestartMicroService,
    setToRestartMicroService,
    toStopMicroService,
    setToStopMicroService,
    microServices,
    currentPage,
    totalPages,
    onPageChange,
    onMicroServiceStart,
    performMicroSerViceStart,
    onMicroServiceRestart,
    performMicroSerViceRestart,
    onMicroServiceStop,
    performMicroSerViceStop,
    performMicroServiceScale,
    refreshInterval,
    setRefreshInterval,
    lastRefreshedAt,
    refreshList,
    isRefreshing,
  } = useMicroServiceList();

  // Calculate overall health status
  const hasDown = microServices?.some((s) => s.health?.status === "DOWN");
  const hasDegraded = microServices?.some(
    (s) => s.health?.status === "DEGRADED",
  );
  const allOperational =
    !hasDown && !hasDegraded && (microServices?.length ?? 0) > 0;

  return (
    <Container fluid="lg" className="my-3">
      {/* Header & Auto-refresh Toolbar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="mb-0 fw-bold">Microservices & System Status</h2>
          <small className="text-muted">
            Live operational monitoring, configuration and deployment dashboard
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            style={{ width: "160px" }}
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
          >
            <option value={10000}>Auto-refresh: 10s</option>
            <option value={30000}>Auto-refresh: 30s</option>
            <option value={60000}>Auto-refresh: 60s</option>
            <option value={0}>Auto-refresh: Off</option>
          </Form.Select>

          <Button
            size="sm"
            variant="outline-primary"
            onClick={refreshList}
            disabled={isRefreshing}
            title="Refresh now"
            className="d-flex align-items-center"
          >
            {isRefreshing ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-1"
                />
                Refreshing...
              </>
            ) : (
              <>
                <ArrowClockwise size={14} className="me-1" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Global Status Banner */}
      <Alert
        variant={allOperational ? "success" : hasDown ? "danger" : "warning"}
        className="d-flex align-items-center gap-3 py-2 px-3 mb-4 shadow-sm"
      >
        {allOperational ? (
          <CheckCircleFill size={24} className="text-success" />
        ) : hasDown ? (
          <XCircleFill size={24} className="text-danger" />
        ) : (
          <ExclamationTriangleFill size={24} className="text-warning" />
        )}
        <div className="flex-grow-1">
          <strong className="fs-6">
            {allOperational
              ? "All Systems Operational"
              : hasDown
                ? "Major Service Outage Detected"
                : "Partial Service Degradation"}
          </strong>
          <div className="small text-muted">
            Last checked at {lastRefreshedAt.toLocaleTimeString()} •{" "}
            {microServices?.length || 0} managed microservices
          </div>
        </div>
      </Alert>

      {/* Microservice Cards List */}
      <MicroServiceList
        items={microServices}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onMicroServiceStart={onMicroServiceStart}
        onMicroServiceRestart={onMicroServiceRestart}
        onMicroServiceStop={onMicroServiceStop}
        onMicroServiceScale={performMicroServiceScale}
      />

      {/* Confirmation Modals */}
      <ConfirmationModal
        show={showStart}
        message={`Are you sure you want to start ${toStartMicroService?.displayName || toStartMicroService?.serviceName || "this microservice"}?`}
        onConfirm={() => {
          if (toStartMicroService) {
            performMicroSerViceStart(toStartMicroService);
          }
          setShowStart(false);
        }}
        onCancel={() => {
          setToStartMicroService(undefined);
          setShowStart(false);
        }}
      />

      <ConfirmationModal
        show={showRestart}
        message={`Are you sure you want to restart ${toRestartMicroService?.displayName || toRestartMicroService?.serviceName || "this microservice"}?`}
        confirmButtonVariant="warning"
        onConfirm={() => {
          if (toRestartMicroService) {
            performMicroSerViceRestart(toRestartMicroService);
          }
          setShowRestart(false);
        }}
        onCancel={() => {
          setToRestartMicroService(undefined);
          setShowRestart(false);
        }}
      />

      <ConfirmationModal
        show={showStop}
        message={`Are you sure you want to stop ${toStopMicroService?.displayName || toStopMicroService?.serviceName || "this microservice"}?`}
        confirmButtonVariant="danger"
        onConfirm={() => {
          if (toStopMicroService) {
            performMicroSerViceStop(toStopMicroService);
          }
          setShowStop(false);
        }}
        onCancel={() => {
          setToStopMicroService(undefined);
          setShowStop(false);
        }}
      />
    </Container>
  );
};

export const MicroServiceListPage = withPageVisit(
  MicroServiceListPageComponent,
  "Monitoring",
);
