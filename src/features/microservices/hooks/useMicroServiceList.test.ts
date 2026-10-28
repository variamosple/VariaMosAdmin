import { act, renderHook } from "@testing-library/react";
import {
  ResponseModel,
  usePaginatedQuery,
} from "@variamosple/variamos-components";
import { MemoryRouter } from "react-router-dom";
import * as MicroServiceRepository from "../api/MicroServiceRepository";
import { useMicroServiceList } from "./useMicroServiceList";

const mockLoadData = vi.fn();
const mockOnPageChange = vi.fn();
const pushToast = vi.fn();

vi.mock("@/shared/context/ToastContext", () => ({
  useToast: () => ({ pushToast, removeToast: vi.fn() }),
}));

vi.mock("@variamosple/variamos-components", async () => {
  return {
    ResponseModel: class ResponseModel<T> {
      errorCode?: number;
      message?: string;
      data?: T;
      type: string;
      constructor(type: string) {
        this.type = type;
      }
      withError(code: number, msg: string) {
        this.errorCode = code;
        this.message = msg;
        return this;
      }
    },
    PagedModel: class PagedModel {
      pageNumber?: number;
      pageSize?: number;
      constructor(pageNumber?: number, pageSize?: number) {
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
      }
    },
    usePaginatedQuery: vi.fn(),
  };
});

describe("useMicroServiceList Hook", () => {
  let startMicroserviceSpy: import("vitest").MockInstance;
  let restartMicroserviceSpy: import("vitest").MockInstance;
  let stopMicroserviceSpy: import("vitest").MockInstance;
  const usePaginatedQueryMock = usePaginatedQuery as import("vitest").Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    startMicroserviceSpy = vi
      .spyOn(MicroServiceRepository, "startMicroservice")
      .mockResolvedValue(new ResponseModel<void>("success"));
    restartMicroserviceSpy = vi
      .spyOn(MicroServiceRepository, "restartMicroservice")
      .mockResolvedValue(new ResponseModel<void>("success"));
    stopMicroserviceSpy = vi
      .spyOn(MicroServiceRepository, "stopMicroservice")
      .mockResolvedValue(new ResponseModel<void>("success"));

    mockLoadData.mockResolvedValue({ data: [] });

    usePaginatedQueryMock.mockReturnValue({
      data: [
        {
          serviceName: "service-1",
          displayName: "Service 1",
          health: {
            status: "UP",
            serviceName: "service-1",
            responseTimeMs: 20,
            checkedAt: new Date().toISOString(),
          },
          replicasCount: 1,
          containers: [],
        },
      ],
      currentPage: 1,
      loadData: mockLoadData,
      isLoading: false,
      totalPages: 1,
      onPageChange: mockOnPageChange,
    });
  });

  afterEach(() => {
    startMicroserviceSpy.mockRestore();
    restartMicroserviceSpy.mockRestore();
    stopMicroserviceSpy.mockRestore();
  });

  it("should initialize with values from query hook", () => {
    const { result } = renderHook(() => useMicroServiceList(), {
      wrapper: MemoryRouter,
    });

    expect(result.current.microServices).toHaveLength(1);
    expect(result.current.microServices[0].serviceName).toBe("service-1");
    expect(result.current.currentPage).toBe(1);
  });

  it("should handle startMicroservice successfully", async () => {
    const { result } = renderHook(() => useMicroServiceList(), {
      wrapper: MemoryRouter,
    });

    await act(async () => {
      await result.current.performMicroSerViceStart({
        serviceName: "service-1",
        displayName: "Service 1",
        health: {
          status: "DOWN",
          serviceName: "service-1",
          responseTimeMs: 0,
          checkedAt: new Date().toISOString(),
        },
        replicasCount: 0,
        containers: [],
      });
    });

    expect(startMicroserviceSpy).toHaveBeenCalledWith("service-1");
    expect(mockLoadData).toHaveBeenCalled();
  });

  it("should handle restartMicroservice successfully", async () => {
    const { result } = renderHook(() => useMicroServiceList(), {
      wrapper: MemoryRouter,
    });

    await act(async () => {
      await result.current.performMicroSerViceRestart({
        serviceName: "service-1",
        displayName: "Service 1",
        health: {
          status: "UP",
          serviceName: "service-1",
          responseTimeMs: 20,
          checkedAt: new Date().toISOString(),
        },
        replicasCount: 1,
        containers: [],
      });
    });

    expect(restartMicroserviceSpy).toHaveBeenCalledWith("service-1");
    expect(mockLoadData).toHaveBeenCalled();
  });

  it("should handle stopMicroservice successfully", async () => {
    const { result } = renderHook(() => useMicroServiceList(), {
      wrapper: MemoryRouter,
    });

    await act(async () => {
      await result.current.performMicroSerViceStop({
        serviceName: "service-1",
        displayName: "Service 1",
        health: {
          status: "UP",
          serviceName: "service-1",
          responseTimeMs: 20,
          checkedAt: new Date().toISOString(),
        },
        replicasCount: 1,
        containers: [],
      });
    });

    expect(stopMicroserviceSpy).toHaveBeenCalledWith("service-1");
    expect(mockLoadData).toHaveBeenCalled();
  });

  it("should call triggerMicroServicesCheck when refreshList(true) is invoked", async () => {
    const triggerCheckSpy = vi
      .spyOn(MicroServiceRepository, "triggerMicroServicesCheck")
      .mockResolvedValue(new ResponseModel<void>("success"));

    const { result } = renderHook(() => useMicroServiceList(), {
      wrapper: MemoryRouter,
    });

    await act(async () => {
      await result.current.refreshList(true);
    });

    expect(triggerCheckSpy).toHaveBeenCalledTimes(1);
    expect(mockLoadData).toHaveBeenCalled();

    triggerCheckSpy.mockRestore();
  });

  describe("action follow-up (EV-86 lot 3)", () => {
    const restarted = {
      serviceName: "service-1",
      displayName: "Service 1",
      health: {
        status: "UP" as const,
        serviceName: "service-1",
        checkedAt: "2026-10-28T19:59:40Z",
      },
      replicasCount: 1,
      containers: [],
    };
    const listed = (status: "UP" | "DOWN", checkedAt: string) => ({
      data: [
        {
          ...restarted,
          health: { status, serviceName: "service-1", checkedAt },
        },
      ],
      currentPage: 1,
      loadData: mockLoadData,
      isLoading: false,
      totalPages: 1,
      onPageChange: mockOnPageChange,
    });

    beforeEach(() => {
      vi.spyOn(
        MicroServiceRepository,
        "triggerMicroServicesCheck",
      ).mockResolvedValue(new ResponseModel<void>("success"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows a restart as under way until a later check finds it UP", async () => {
      vi.useFakeTimers({ now: Date.parse("2026-10-28T20:00:00Z") });
      usePaginatedQueryMock.mockReturnValue(
        listed("UP", "2026-10-28T19:59:40Z"),
      );
      const { result, rerender } = renderHook(() => useMicroServiceList(), {
        wrapper: MemoryRouter,
      });

      await act(async () => {
        await result.current.performMicroSerViceRestart(restarted);
      });

      // The UP of before the restart does not end it
      expect(result.current.followUps["service-1"]?.step).toBe("restarting");

      usePaginatedQueryMock.mockReturnValue(
        listed("UP", "2026-10-28T20:00:10Z"),
      );
      rerender();

      expect(result.current.followUps["service-1"]).toBeUndefined();
      expect(pushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Service 1 is running",
          variant: "success",
        }),
      );
    });

    it("checks the pending service again while waiting", async () => {
      vi.useFakeTimers({ now: Date.parse("2026-10-28T20:00:00Z") });
      usePaginatedQueryMock.mockReturnValue(
        listed("UP", "2026-10-28T19:59:40Z"),
      );
      const { result } = renderHook(() => useMicroServiceList(), {
        wrapper: MemoryRouter,
      });
      await act(async () => {
        await result.current.performMicroSerViceRestart(restarted);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000);
      });

      expect(
        MicroServiceRepository.triggerMicroServicesCheck,
      ).toHaveBeenCalledWith("service-1");
    });

    it("shows a restart as failed when the service is not back in time", async () => {
      vi.useFakeTimers({ now: Date.parse("2026-10-28T20:00:00Z") });
      usePaginatedQueryMock.mockReturnValue(
        listed("UP", "2026-10-28T19:59:40Z"),
      );
      const { result, rerender } = renderHook(() => useMicroServiceList(), {
        wrapper: MemoryRouter,
      });
      await act(async () => {
        await result.current.performMicroSerViceRestart(restarted);
      });

      vi.setSystemTime(Date.parse("2026-10-28T20:01:31Z"));
      usePaginatedQueryMock.mockReturnValue(
        listed("DOWN", "2026-10-28T20:01:30Z"),
      );
      rerender();

      expect(result.current.followUps["service-1"]?.step).toBe("failed");
      expect(pushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Service 1 did not come back",
          variant: "danger",
        }),
      );
    });

    it("says why an action was refused, and follows nothing", async () => {
      vi.spyOn(MicroServiceRepository, "stopMicroservice").mockResolvedValue(
        new ResponseModel<void>("error").withError(
          400,
          "MicroService is not in running state.",
        ),
      );
      const { result } = renderHook(() => useMicroServiceList(), {
        wrapper: MemoryRouter,
      });

      await act(async () => {
        await result.current.performMicroSerViceStop(restarted);
      });

      expect(result.current.followUps).toEqual({});
      expect(pushToast).toHaveBeenCalledWith({
        title: "Service 1 could not be stopped",
        message: "MicroService is not in running state.",
        variant: "danger",
      });
    });

    it("ends a stop with the answer of the action", async () => {
      const { result } = renderHook(() => useMicroServiceList(), {
        wrapper: MemoryRouter,
      });

      await act(async () => {
        await result.current.performMicroSerViceStop(restarted);
      });

      expect(result.current.followUps).toEqual({});
      expect(pushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Service 1 stopped",
          variant: "success",
        }),
      );
    });
  });
});
