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

// The start, restart and stop confirmations, and the service each is about
const useServiceDialogs = () => {
  const [showStart, setShowStart] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [toStartMicroService, setToStartMicroService] =
    useState<MicroService>();
  const [toRestartMicroService, setToRestartMicroService] =
    useState<MicroService>();
  const [toStopMicroService, setToStopMicroService] = useState<MicroService>();

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
    onMicroServiceStart: (microService: MicroService) => {
      setToStartMicroService(microService);
      setShowStart(true);
    },
    onMicroServiceRestart: (microService: MicroService) => {
      setToRestartMicroService(microService);
      setShowRestart(true);
    },
    onMicroServiceStop: (microService: MicroService) => {
      setToStopMicroService(microService);
      setShowStop(true);
    },
  };
};

interface ShownPage {
  loadData: (
    filter: MicroServiceFilter,
  ) => Promise<ResponseModel<MicroService[]>>;
  filter: MicroServiceFilter | null;
  initialFilter: MicroServiceFilter;
}

// The page read again on demand, and every refreshInterval ms
const useRefresh = (page: ShownPage, initialRefreshInterval: number) => {
  const { loadData, filter, initialFilter } = page;
  const [refreshInterval, setRefreshInterval] = useState<number>(
    initialRefreshInterval,
  );
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshList = useCallback(
    (triggerCheck = false) => {
      setIsRefreshing(true);
      const preAction = triggerCheck
        ? triggerMicroServicesCheck().catch(() => undefined)
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

  // Periodic Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const timer = setInterval(() => {
      void refreshList();
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [refreshInterval, refreshList]);

  return {
    refreshInterval,
    setRefreshInterval,
    lastRefreshedAt,
    refreshList,
    isRefreshing,
  };
};

type SetFollowUp = (serviceKey: string, followUp: FollowUp | undefined) => void;

// While a start or a restart is pending, check that service again and
// reload the page every FOLLOW_UP_POLL_MS
const usePendingChecks = (
  followUps: Record<string, FollowUp>,
  refreshList: () => Promise<void>,
) => {
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
            triggerMicroServicesCheck(serviceKey).catch(() => undefined),
          ),
      ).then(() => refreshList());
    }, FOLLOW_UP_POLL_MS);
    return () => clearInterval(timer);
  }, [waitingKeys, refreshList]);
};

interface Settling {
  microServices: MicroService[] | undefined;
  followUps: Record<string, FollowUp>;
  setFollowUp: SetFollowUp;
}

// Settles the pending starts and restarts against the services listed
const useFollowUpOutcomes = ({
  microServices,
  followUps,
  setFollowUp,
}: Settling) => {
  const { pushToast } = useToast();
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
};

// Start, restart and stop under way, by service key (EV-86 lot 3)
const useServiceActions = (
  microServices: MicroService[] | undefined,
  refreshList: () => Promise<void>,
) => {
  const { pushToast } = useToast();
  const [followUps, setFollowUps] = useState<Record<string, FollowUp>>({});

  const setFollowUp: SetFollowUp = useCallback(
    (serviceKey, followUp) =>
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
      void refreshList();
      return response;
    });
  };

  usePendingChecks(followUps, refreshList);
  useFollowUpOutcomes({ microServices, followUps, setFollowUp });

  return {
    followUps,
    performMicroSerViceStart: (microService: MicroService) =>
      performAction(microService, "starting", startMicroservice, "started"),
    performMicroSerViceRestart: (microService: MicroService) =>
      performAction(
        microService,
        "restarting",
        restartMicroservice,
        "restarted",
      ),
    performMicroSerViceStop: (microService: MicroService) =>
      performAction(microService, "stopping", stopMicroservice, "stopped"),
  };
};

export const useMicroServiceList = (
  initialRefreshInterval: number = DEFAULT_REFRESH_INTERVAL_MS,
) => {
  const dialogs = useServiceDialogs();
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

  useListQueryState({ filter, currentPage, loadData }, microServicesFromParams);
  const refresh = useRefresh(
    { loadData, filter, initialFilter },
    initialRefreshInterval,
  );
  const actions = useServiceActions(microServices, refresh.refreshList);

  return {
    listState,
    ...dialogs,
    microServices,
    currentPage,
    totalPages,
    onPageChange,
    ...actions,
    ...refresh,
  };
};
