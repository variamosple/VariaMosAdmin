import { act, renderHook } from "@testing-library/react";
import {
  ResponseModel,
  usePaginatedQuery,
} from "@variamosple/variamos-components";
import * as MicroServiceRepository from "../api/MicroServiceRepository";
import { useMicroServiceList } from "./useMicroServiceList";

const mockLoadData = vi.fn();
const mockOnPageChange = vi.fn();

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
    const { result } = renderHook(() => useMicroServiceList());

    expect(result.current.microServices).toHaveLength(1);
    expect(result.current.microServices[0].serviceName).toBe("service-1");
    expect(result.current.currentPage).toBe(1);
  });

  it("should handle startMicroservice successfully", async () => {
    const { result } = renderHook(() => useMicroServiceList());

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
    const { result } = renderHook(() => useMicroServiceList());

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
    const { result } = renderHook(() => useMicroServiceList());

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

    const { result } = renderHook(() => useMicroServiceList());

    await act(async () => {
      await result.current.refreshList(true);
    });

    expect(triggerCheckSpy).toHaveBeenCalledTimes(1);
    expect(mockLoadData).toHaveBeenCalled();

    triggerCheckSpy.mockRestore();
  });
});
