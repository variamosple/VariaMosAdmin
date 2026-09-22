import { usePaginatedQuery } from "@variamosple/variamos-components";
import { useCallback, useEffect, useState } from "react";
import {
  queryMicroServices,
  restartMicroservice,
  scaleMicroservice,
  startMicroservice,
  stopMicroservice,
  triggerMicroServicesCheck,
} from "../api/MicroServiceRepository";
import type { MicroService } from "../domain/Entity/MicroService";
import { MicroServiceFilter } from "../domain/Entity/MicroServiceFilter";

export const useMicroServiceList = (initialRefreshInterval: number = 0) => {
  const [showStart, setShowStart] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(
    initialRefreshInterval,
  );
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [toStartMicroService, setToStartMicroService] =
    useState<MicroService>();
  const [toRestartMicroService, setToRestartMicroService] =
    useState<MicroService>();
  const [toStopMicroService, setToStopMicroService] = useState<MicroService>();

  const [initialFilter] = useState(() => new MicroServiceFilter());

  const {
    data: microServices,
    currentPage,
    loadData,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<MicroServiceFilter, MicroService>({
    queryFunction: queryMicroServices,
    initialFilter,
  });

  const refreshList = useCallback(
    (triggerCheck: boolean = false) => {
      setIsRefreshing(true);
      const preAction = triggerCheck
        ? triggerMicroServicesCheck().catch(() => {})
        : Promise.resolve();

      return preAction
        .then(() => loadData(initialFilter))
        .then(() => {
          setLastRefreshedAt(new Date());
        })
        .finally(() => {
          setIsRefreshing(false);
        });
    },
    [loadData, initialFilter],
  );

  useEffect(() => {
    loadData(initialFilter);
  }, [loadData, initialFilter]);

  // Periodic Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const timer = setInterval(() => {
      refreshList();
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [refreshInterval, refreshList]);

  const onMicroSerViceStart = (microService: MicroService) => {
    setToStartMicroService(microService);
    setShowStart(true);
  };

  const performMicroSerViceStart = (microService: MicroService) => {
    const serviceKey =
      microService.serviceName || microService.id || microService.displayName;
    return startMicroservice(serviceKey).then((response) => {
      if (!response.errorCode) {
        refreshList();
      }
      return response;
    });
  };

  const onMicroSerViceRestart = (microService: MicroService) => {
    setToRestartMicroService(microService);
    setShowRestart(true);
  };

  const performMicroSerViceRestart = (microService: MicroService) => {
    const serviceKey =
      microService.serviceName || microService.id || microService.displayName;
    return restartMicroservice(serviceKey).then((response) => {
      if (!response.errorCode) {
        refreshList();
      }
      return response;
    });
  };

  const onMicroSerViceStop = (microService: MicroService) => {
    setToStopMicroService(microService);
    setShowStop(true);
  };

  const performMicroSerViceStop = (microService: MicroService) => {
    const serviceKey =
      microService.serviceName || microService.id || microService.displayName;
    return stopMicroservice(serviceKey).then((response) => {
      if (!response.errorCode) {
        refreshList();
      }
      return response;
    });
  };

  const performMicroServiceScale = (
    microService: MicroService,
    replicas: number,
  ) => {
    const serviceKey =
      microService.serviceName || microService.id || microService.displayName;
    return scaleMicroservice(serviceKey, replicas).then((response) => {
      if (!response.errorCode) {
        refreshList();
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
    setToStopMicroService,
    setToDeleteMicroService: setToStopMicroService,
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
    performMicroServiceScale,
    refreshInterval,
    setRefreshInterval,
    lastRefreshedAt,
    refreshList,
    isRefreshing,
  };
};
