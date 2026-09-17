import { withPageVisit } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { ArrowClockwise } from "react-bootstrap-icons";
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
    refreshList,
    isRefreshing,
  } = useMicroServiceList();

  return (
    <Container fluid="sm" className="my-2">
      {/* Header & Controls toolbar */}
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="mb-0">Microservices & System Status</h1>
        </Col>

        <Col xs="auto" className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            style={{ width: "150px" }}
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            aria-label="Auto-refresh interval"
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
            title="Refresh"
            className="d-inline-flex align-items-center"
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
                <ArrowClockwise size={16} className="me-1" />
                Refresh
              </>
            )}
          </Button>
        </Col>
      </Row>

      <hr />

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
