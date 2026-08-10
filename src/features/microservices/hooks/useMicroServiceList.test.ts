import { act, renderHook } from "@testing-library/react";
import { usePaginatedQuery } from "@variamosple/variamos-components";
import * as MicroServiceRepository from "../api/MicroServiceRepository";
import { useMicroServiceList } from "./useMicroServiceList";

const mockLoadData = vi.fn();
const mockOnPageChange = vi.fn();

vi.mock("@variamosple/variamos-components", async () => {
  return {
    ResponseModel: class ResponseModel {
      errorCode?: number;
      message?: string;
      data?: any;
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
      .mockResolvedValue({ errorCode: null } as any);
    restartMicroserviceSpy = vi
      .spyOn(MicroServiceRepository, "restartMicroservice")
      .mockResolvedValue({ errorCode: null } as any);
    stopMicroserviceSpy = vi
      .spyOn(MicroServiceRepository, "stopMicroservice")
      .mockResolvedValue({ errorCode: null } as any);

    mockLoadData.mockResolvedValue({ data: [] });

    usePaginatedQueryMock.mockReturnValue({
      data: [
        {
          id: "1",
          names: ["micro-1"],
          state: "running",
          status: "up",
          created: new Date(),
          labels: {},
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

    expect(result.current.microServices).toEqual([
      {
        id: "1",
        names: ["micro-1"],
        state: "running",
        status: "up",
        created: expect.any(Date),
        labels: {},
      },
    ]);
    expect(result.current.currentPage).toBe(1);
  });

  it("should handle startMicroservice successfully", async () => {
    const { result } = renderHook(() => useMicroServiceList());

    await act(async () => {
      await result.current.performMicroSerViceStart({
        id: "1",
        names: ["micro-1"],
        state: "exited",
        status: "down",
        created: new Date(),
        labels: {},
      });
    });

    expect(startMicroserviceSpy).toHaveBeenCalledWith("1");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("should handle restartMicroservice successfully", async () => {
    const { result } = renderHook(() => useMicroServiceList());

    await act(async () => {
      await result.current.performMicroSerViceRestart({
        id: "1",
        names: ["micro-1"],
        state: "running",
        status: "up",
        created: new Date(),
        labels: {},
      });
    });

    expect(restartMicroserviceSpy).toHaveBeenCalledWith("1");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("should handle stopMicroservice successfully", async () => {
    const { result } = renderHook(() => useMicroServiceList());

    await act(async () => {
      await result.current.performMicroSerViceStop({
        id: "1",
        names: ["micro-1"],
        state: "running",
        status: "up",
        created: new Date(),
        labels: {},
      });
    });

    expect(stopMicroserviceSpy).toHaveBeenCalledWith("1");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });
});
