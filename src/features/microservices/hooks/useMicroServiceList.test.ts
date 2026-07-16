import { renderHook, act } from "@testing-library/react";
import { useMicroServiceList } from "./useMicroServiceList";
import * as MicroServiceRepository from "../api/MicroServiceRepository";
import { usePaginatedQuery } from "@variamosple/variamos-components";

// Mock dependencies
jest.mock("../api/MicroServiceRepository");

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
  const startMicroserviceMock = MicroServiceRepository.startMicroservice as jest.Mock;
  const restartMicroserviceMock = MicroServiceRepository.restartMicroservice as jest.Mock;
  const stopMicroserviceMock = MicroServiceRepository.stopMicroservice as jest.Mock;
  const usePaginatedQueryMock = usePaginatedQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

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
    startMicroserviceMock.mockResolvedValue({ errorCode: null });
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

    expect(startMicroserviceMock).toHaveBeenCalledWith("1");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("should handle restartMicroservice successfully", async () => {
    restartMicroserviceMock.mockResolvedValue({ errorCode: null });
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

    expect(restartMicroserviceMock).toHaveBeenCalledWith("1");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("should handle stopMicroservice successfully", async () => {
    stopMicroserviceMock.mockResolvedValue({ errorCode: null });
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

    expect(stopMicroserviceMock).toHaveBeenCalledWith("1");
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });
});
