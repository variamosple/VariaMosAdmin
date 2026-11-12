import {
  type ResponseModel,
  withPageVisit,
} from "@variamosple/variamos-components";
import { type FC, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { ArrowClockwise } from "react-bootstrap-icons";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { MicroServiceConfigModal } from "../../components/MicroServiceConfigModal";
import { MicroServiceList } from "../../components/MicroServiceList";
import type { MicroService } from "../../domain/Entity/MicroService";
import { useMicroServiceList } from "../../hooks/useMicroServiceList";

type ServiceList = ReturnType<typeof useMicroServiceList>;

const RefreshControls: FC<{ list: ServiceList }> = ({ list }) => (
  <Col xs="auto" className="d-flex align-items-center gap-2">
    <small className="text-muted">
      Updated {list.lastRefreshedAt.toLocaleTimeString()}
    </small>
    <Form.Select
      size="sm"
      style={{ width: "160px" }}
      value={list.refreshInterval}
      onChange={(e) => list.setRefreshInterval(Number(e.target.value))}
      aria-label="Page auto-refresh interval"
      title="Page display auto-refresh interval (browser only)"
    >
      <option value={10000}>Page Refresh: 10s</option>
      <option value={30000}>Page Refresh: 30s</option>
      <option value={60000}>Page Refresh: 60s</option>
      <option value={0}>Page Refresh: Off</option>
    </Form.Select>

    <Button
      size="sm"
      variant="outline-primary"
      onClick={() => list.refreshList(true)}
      disabled={list.isRefreshing}
      title="Refresh"
      className="d-inline-flex align-items-center"
    >
      {list.isRefreshing ? (
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
);

const ConnectionLost: FC<{ list: ServiceList }> = ({ list }) => (
  <Alert variant="warning" className="d-flex align-items-center gap-2">
    <span>
      Connection to the administration service lost: the statuses below date
      from {list.lastRefreshedAt.toLocaleTimeString()}. ({list.listState.error})
    </span>
    <Button
      size="sm"
      variant="outline-dark"
      className="ms-auto"
      onClick={() => list.refreshList(true)}
    >
      Retry
    </Button>
  </Alert>
);

interface ActionConfirmationProps {
  // "Start", "Restart" or "Stop"
  verb: string;
  show: boolean;
  microService?: MicroService;
  variant?: string;
  perform: (microService: MicroService) => Promise<ResponseModel<void>>;
  setShow: (show: boolean) => void;
  setMicroService: (microService: MicroService | undefined) => void;
}

const ActionConfirmation: FC<ActionConfirmationProps> = (props) => {
  const { verb, microService, setShow } = props;
  return (
    <ConfirmationModal
      show={props.show}
      title={`${verb} microservice`}
      message={`${verb} ${microService?.displayName || microService?.serviceName || "this microservice"}?`}
      confirmLabel={`${verb} microservice`}
      confirmButtonVariant={props.variant}
      onConfirm={() => {
        if (microService) {
          void props.perform(microService);
        }
        setShow(false);
      }}
      onCancel={() => {
        props.setMicroService(undefined);
        setShow(false);
      }}
    />
  );
};

const ActionConfirmations: FC<{ list: ServiceList }> = ({ list }) => (
  <>
    <ActionConfirmation
      verb="Start"
      show={list.showStart}
      microService={list.toStartMicroService}
      perform={list.performMicroSerViceStart}
      setShow={list.setShowStart}
      setMicroService={list.setToStartMicroService}
    />
    <ActionConfirmation
      verb="Restart"
      show={list.showRestart}
      microService={list.toRestartMicroService}
      variant="warning"
      perform={list.performMicroSerViceRestart}
      setShow={list.setShowRestart}
      setMicroService={list.setToRestartMicroService}
    />
    <ActionConfirmation
      verb="Stop"
      show={list.showStop}
      microService={list.toStopMicroService}
      variant="danger"
      perform={list.performMicroSerViceStop}
      setShow={list.setShowStop}
      setMicroService={list.setToStopMicroService}
    />
  </>
);

const MicroServiceListPageComponent: FC = () => {
  usePageTitle("Microservices");
  const [selectedConfigService, setSelectedConfigService] = useState<
    MicroService | undefined
  >(undefined);
  const list = useMicroServiceList();
  const { microServices, listState } = list;

  // A failed reload leaves the last statuses on screen: say they are old
  // instead of letting them pass for current ones (EV-86 lot 2)
  const isConnectionLost = Boolean(listState.error) && microServices.length > 0;

  return (
    <Container fluid="sm" className="my-2">
      {/* Header & Controls toolbar */}
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="mb-0">Microservices & System Status</h1>
        </Col>
        <RefreshControls list={list} />
      </Row>

      <hr />

      {isConnectionLost ? <ConnectionLost list={list} /> : null}

      {/* Microservice Cards List */}
      <MicroServiceList
        items={microServices}
        state={isConnectionLost ? { ...listState, error: null } : listState}
        followUps={list.followUps}
        totalPages={list.totalPages}
        currentPage={list.currentPage}
        onPageChange={list.onPageChange}
        onMicroServiceStart={list.onMicroServiceStart}
        onMicroServiceRestart={list.onMicroServiceRestart}
        onMicroServiceStop={list.onMicroServiceStop}
        onMicroServiceConfigure={(ms) => setSelectedConfigService(ms)}
      />

      {/* Service Configuration & Audit Modal */}
      {selectedConfigService ? (
        <MicroServiceConfigModal
          show={Boolean(selectedConfigService)}
          serviceName={selectedConfigService.serviceName}
          displayName={
            selectedConfigService.displayName ||
            selectedConfigService.serviceName
          }
          onHide={() => setSelectedConfigService(undefined)}
        />
      ) : null}

      <ActionConfirmations list={list} />
    </Container>
  );
};

export const MicroServiceListPage = withPageVisit(
  MicroServiceListPageComponent,
  "Monitoring",
);
