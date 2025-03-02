import {
  queryMicroServices,
  restartMicroservice,
  startMicroservice,
  stopMicroservice,
} from "@/DataProviders/MicroServiceRepository";
import { MicroService } from "@/Domain/MicroService/MicroService";
import { MicroServiceFilter } from "@/Domain/MicroService/MicroServiceFilter";
import { FC, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { usePaginatedQuery, withPageVisit } from "variamos-components";
import ConfirmationModal from "../Components/ConfirmationModal";
import { MicroServiceList } from "../Components/MicroServiceList";

const MicroServiceListPageComponent: FC<unknown> = () => {
  const [showStart, setShowStart] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [showStop, setShowStop] = useState(false);

  const [toStartMicroService, setToStartMicroService] =
    useState<MicroService>();
  const [toRestartMicroService, setToRestartMicroService] =
    useState<MicroService>();
  const [toStopMicroService, setToStopMicroService] = useState<MicroService>();

  const onMicroSerViceStart = (microService: MicroService) => {
    setToStartMicroService(microService);
    setShowStart(true);
  };

  const performMicroSerViceStart = (microService: MicroService) => {
    return startMicroservice(microService.id).then((response) => {
      if (!response.errorCode) {
        onPageChange(currentPage);
      }

      return response;
    });
  };

  const onMicroSerViceRestart = (microService: MicroService) => {
    setToRestartMicroService(microService);
    setShowRestart(true);
  };

  const performMicroSerViceRestart = (microService: MicroService) => {
    return restartMicroservice(microService.id).then((response) => {
      if (!response.errorCode) {
        onPageChange(currentPage);
      }

      return response;
    });
  };

  const onMicroSerViceStop = (microService: MicroService) => {
    setToStopMicroService(microService);
    setShowStop(true);
  };

  const performMicroSerViceStop = (microService: MicroService) => {
    return stopMicroservice(microService.id).then((response) => {
      if (!response.errorCode) {
        onPageChange(currentPage);
      }

      return response;
    });
  };

  const {
    data: microServices,
    currentPage,
    loadData,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<MicroServiceFilter, MicroService>({
    queryFunction: queryMicroServices,
    initialFilter: new MicroServiceFilter(),
  });

  useEffect(() => {
    loadData(new MicroServiceFilter());
  }, [loadData]);

  return (
    <Container fluid="sm" className="my-2">
      <h1 className="mb-0">Monitoring - Microservices list</h1>

      <hr />

      <MicroServiceList
        items={microServices}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onMicroServiceStart={onMicroSerViceStart}
        onMicroServiceRestart={onMicroSerViceRestart}
        onMicroServiceStop={onMicroSerViceStop}
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
          setToStopMicroService(undefined);
          setShowStop(false);
        }}
      />
    </Container>
  );
};

export const MicroServiceListPage = withPageVisit(
  MicroServiceListPageComponent,
  "Monitoring"
);
