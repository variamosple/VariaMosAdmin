import { renderHook, act } from "@testing-library/react";
import { useMicroServiceList } from "./useMicroServiceList";
import * as MicroServiceRepository from "../api/MicroServiceRepository";
import { usePaginatedQuery } from "@variamosple/variamos-components";

const mockLoadData = jest.fn();
const mockOnPageChange = jest.fn();

jest.mock("@variamosple/variamos-components", () => {
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
    usePaginatedQuery: jest.fn(),
  };
});

describe("useMicroServiceList Hook", () => {
  let startMicroserviceSpy: jest.SpyInstance;
  let restartMicroserviceSpy: jest.SpyInstance;
  let stopMicroserviceSpy: jest.SpyInstance;
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    startMicroserviceSpy = jest
      .spyOn(MicroServiceRepository, "startMicroservice")
      .mockResolvedValue({ errorCode: null } as any);
    restartMicroserviceSpy = jest
      .spyOn(MicroServiceRepository, "restartMicroservice")
      .mockResolvedValue({ errorCode: null } as any);
    stopMicroserviceSpy = jest
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
