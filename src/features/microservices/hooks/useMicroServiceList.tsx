import { useEffect, useState } from "react";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import { MicroService } from "../domain/Entity/MicroService";
import { MicroServiceFilter } from "../domain/Entity/MicroServiceFilter";
import {
  queryMicroServices,
  restartMicroservice,
  startMicroservice,
  stopMicroservice,
} from "../api/MicroServiceRepository";

export const useMicroServiceList = () => {
  const [showStart, setShowStart] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [showStop, setShowStop] = useState(false);

  const [toStartMicroService, setToStartMicroService] = useState<MicroService>();
  const [toRestartMicroService, setToRestartMicroService] = useState<MicroService>();
  const [toStopMicroService, setToStopMicroService] = useState<MicroService>();

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

  return {
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
    setToDeleteMicroService: setToStopMicroService, // aligning with expected pattern or naming
    microServices,
    currentPage,
    totalPages,
    onPageChange,
    onMicroServiceStart: onMicroSerViceStart,
    performMicroSerViceStart,
    onMicroServiceRestart: onMicroSerViceRestart,
    performMicroSerViceRestart,
    onMicroServiceStop: onMicroSerViceStop,
    performMicroSerViceStop,
  };
};
