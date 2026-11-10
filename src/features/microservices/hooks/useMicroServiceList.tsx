import type { ResponseModel } from "@variamosple/variamos-components";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/shared/context/ToastContext";
import { readPage, useListQueryState } from "@/shared/hooks/useListQueryState";
import { usePagedList } from "@/shared/hooks/usePagedList";
import {
  queryMicroServices,
  restartMicroservice,
  startMicroservice,
  stopMicroservice,
  triggerMicroServicesCheck,
} from "../api/MicroServiceRepository";
import {
  FOLLOW_UP_POLL_MS,
  FOLLOW_UP_TIMEOUT_MS,
  type FollowUp,
  type FollowUpStep,
  followUpOutcome,
  isWaitingForService,
  serviceKeyOf,
} from "../domain/actionFollowUp";
import type { MicroService } from "../domain/Entity/MicroService";
import { MicroServiceFilter } from "../domain/Entity/MicroServiceFilter";

// The page shown by the address (UX-26)
const microServicesFromParams = (params: URLSearchParams) =>
  new MicroServiceFilter(undefined, readPage(params));

const nameOf = (microService: MicroService) =>
  microService.displayName || microService.serviceName;

// The page reloads every 30 s unless the operator turns it off (EV-86 lot 2)
const DEFAULT_REFRESH_INTERVAL_MS = 30_000;

export const useMicroServiceList = (
  initialRefreshInterval: number = DEFAULT_REFRESH_INTERVAL_MS,
) => {
  const { pushToast } = useToast();
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

  // Start, restart and stop under way, by service key (EV-86 lot 3)
  const [followUps, setFollowUps] = useState<Record<string, FollowUp>>({});

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
          .then((response) => {
            // A failed reload leaves older statuses on screen
            if (!response?.errorCode) setLastRefreshedAt(new Date());
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

  const setFollowUp = useCallback(
    (serviceKey: string, followUp: FollowUp | undefined) =>
      setFollowUps((current) => {
        const { [serviceKey]: _previous, ...others } = current;
        return followUp ? { ...others, [serviceKey]: followUp } : others;
      }),
    [],
  );

  /**
   * Runs a container action and follows it on the row: a stop ends with the
   * answer; a start or a restart waits for a check that finds the service
   * back, or fails after FOLLOW_UP_TIMEOUT_MS.
   */
  const performAction = (
    microService: MicroService,
    step: FollowUpStep,
    action: (serviceKey: string) => Promise<ResponseModel<void>>,
    verb: string,
  ) => {
    const serviceKey = serviceKeyOf(microService);
    const name = nameOf(microService);
    setFollowUp(serviceKey, { step, since: Date.now() });
    return action(serviceKey).then((response) => {
      if (response.errorCode) {
        setFollowUp(serviceKey, undefined);
        pushToast({
          title: `${name} could not be ${verb}`,
          message: response.message || "The action failed.",
          variant: "danger",
        });
        return response;
      }
      if (step === "stopping") {
        setFollowUp(serviceKey, undefined);
        pushToast({
          title: `${name} stopped`,
          message: "The container is stopped.",
          variant: "success",
        });
      }
      // The pending service is checked again on its own, below
      refreshList();
      return response;
    });
  };

  const performMicroSerViceStart = (microService: MicroService) =>
    performAction(microService, "starting", startMicroservice, "started");

  const onMicroSerViceRestart = (microService: MicroService) => {
    setToRestartMicroService(microService);
    setShowRestart(true);
  };

  const performMicroSerViceRestart = (microService: MicroService) =>
    performAction(microService, "restarting", restartMicroservice, "restarted");

  const onMicroSerViceStop = (microService: MicroService) => {
    setToStopMicroService(microService);
    setShowStop(true);
  };

  const performMicroSerViceStop = (microService: MicroService) =>
    performAction(microService, "stopping", stopMicroservice, "stopped");

  // While a start or a restart is pending, check that service again and
  // reload the page every FOLLOW_UP_POLL_MS
  const waitingKeys = Object.entries(followUps)
    .filter(([, followUp]) => isWaitingForService(followUp))
    .map(([serviceKey]) => serviceKey)
    .join(",");
  useEffect(() => {
    if (!waitingKeys) return;
    const timer = setInterval(() => {
      void Promise.all(
        waitingKeys
          .split(",")
          .map((serviceKey) =>
            triggerMicroServicesCheck(serviceKey).catch(() => {}),
          ),
      ).then(() => refreshList());
    }, FOLLOW_UP_POLL_MS);
    return () => clearInterval(timer);
  }, [waitingKeys, refreshList]);

  // Settles the pending starts and restarts against the services listed
  useEffect(() => {
    const now = Date.now();
    for (const [serviceKey, followUp] of Object.entries(followUps)) {
      const microService = microServices?.find(
        (candidate) => serviceKeyOf(candidate) === serviceKey,
      );
      const outcome = followUpOutcome(followUp, microService, now);
      const name = microService ? nameOf(microService) : serviceKey;
      if (outcome === "running") {
        setFollowUp(serviceKey, undefined);
        pushToast({
          title: `${name} is running`,
          message: "Its health check answers again.",
          variant: "success",
        });
      } else if (outcome === "failed") {
        setFollowUp(serviceKey, { step: "failed", since: followUp.since });
        pushToast({
          title: `${name} did not come back`,
          message: `No health check answered within ${FOLLOW_UP_TIMEOUT_MS / 1000} s. Look at its logs.`,
          variant: "danger",
        });
      }
    }
  }, [microServices, followUps, setFollowUp, pushToast]);

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
    followUps,
  };
};
