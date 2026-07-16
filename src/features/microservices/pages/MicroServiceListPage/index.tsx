import { MicroServiceList } from "../../components/MicroServiceList";
import { useMicroServiceList } from "../../hooks/useMicroServiceList";
import { withPageVisit } from "@variamosple/variamos-components";
import ConfirmationModal from "@/UI/Components/ConfirmationModal";
import { FC } from "react";
import { Container } from "react-bootstrap";

const MicroServiceListPageComponent: FC<unknown> = () => {
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
  } = useMicroServiceList();

  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">Monitoring - Microservices list</h1>

      <hr />

      <MicroServiceList
        items={microServices}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onMicroServiceStart={onMicroServiceStart}
        onMicroServiceRestart={onMicroServiceRestart}
        onMicroServiceStop={onMicroServiceStop}
      />

      <ConfirmationModal
        show={showStart}
        message="Are you sure you want to start the microservice?"
        onConfirm={() => {
          performMicroSerViceStart(toStartMicroService!);
          setShowStart(false);
        }}
        onCancel={() => {
          setToStartMicroService(undefined);
          setShowStart(false);
        }}
      />

      <ConfirmationModal
        show={showRestart}
        message="Are you sure you want to restart the microservice?"
        confirmButtonVariant="warning"
        onConfirm={() => {
          performMicroSerViceRestart(toRestartMicroService!);
          setShowRestart(false);
        }}
        onCancel={() => {
          setToRestartMicroService(undefined);
          setShowRestart(false);
        }}
      />

      <ConfirmationModal
        show={showStop}
        message="Are you sure you want to stop the microservice?"
        confirmButtonVariant="danger"
        onConfirm={() => {
          performMicroSerViceStop(toStopMicroService!);
          setShowStop(false);
        }}
        onCancel={() => {
          setToRestartMicroService(undefined);
          setShowStop(false);
        }}
      />
    </Container>
  );
};

export const MicroServiceListPage = withPageVisit(MicroServiceListPageComponent, "Monitoring");
