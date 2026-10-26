import { useCallback, useEffect, useState } from "react";
import { readPage, useListQueryState } from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";
import {
  queryMicroServices,
  restartMicroservice,
  startMicroservice,
  stopMicroservice,
  triggerMicroServicesCheck,
} from "../api/MicroServiceRepository";
import type { MicroService } from "../domain/Entity/MicroService";
import { MicroServiceFilter } from "../domain/Entity/MicroServiceFilter";

// The page shown by the address (UX-26)
const microServicesFromParams = (params: URLSearchParams) =>
  new MicroServiceFilter(undefined, readPage(params));

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
    filter,
    totalPages,
    onPageChange,
    listState,
  } = usePagedList<MicroServiceFilter, MicroService>({
    queryFunction: queryMicroServices,
    initialFilter,
  });

  const refreshList = useCallback(
    (triggerCheck: boolean = false) => {
      setIsRefreshing(true);
      const preAction = triggerCheck
        ? triggerMicroServicesCheck().catch(() => {})
        : Promise.resolve();

      return (
        preAction
          // The page on screen, which the address may have chosen
          .then(() => loadData(filter ?? initialFilter))
          .then(() => {
            setLastRefreshedAt(new Date());
          })
          .finally(() => {
            setIsRefreshing(false);
          })
      );
    },
    [loadData, filter, initialFilter],
  );

  useListQueryState({ filter, currentPage, loadData }, microServicesFromParams);

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

  return {
    listState,
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
    refreshInterval,
    setRefreshInterval,
    lastRefreshedAt,
    refreshList,
    isRefreshing,
  };
};
