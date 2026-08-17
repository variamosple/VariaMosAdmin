import axios from "axios";
import { handleRepositoryError } from "./RepositoryUtils";

vi.mock("@variamosple/variamos-components", async () => {
  return {
    ResponseModel: class ResponseModel<T> {
      errorCode?: number;
      message?: string;
      data?: T;
      type: string;
      transactionId: string;
      constructor(type: string) {
        this.type = type;
        this.transactionId = type;
      }
      withError(code: number, msg: string) {
        this.errorCode = code;
        this.message = msg;
        return this;
      }
    },
  };
});

interface MockedResponse {
  type?: string;
  transactionId?: string;
  errorCode?: number;
  message?: string;
}

describe("RepositoryUtils handleRepositoryError", () => {
  let consoleSpy: import("vitest").MockInstance;

  beforeAll(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });
  it("should return error response data if it exists in Axios error", () => {
    const mockResponseData = {
      errorCode: 400,
      message: "Custom Backend Error",
      type: "BACK-ERROR",
    };
    const mockAxiosError = {
      isAxiosError: true,
      response: { data: mockResponseData },
      message: "Request failed",
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    const result = handleRepositoryError(
      mockAxiosError,
      "Fallback msg",
    ) as MockedResponse;
    expect(result.type).toBe("BACK-ERROR");
    expect(result.errorCode).toBe(400);
    expect(result.message).toBe("Custom Backend Error");
  });

  it("should return formatted BACK-ERROR if no response data is in Axios error", () => {
    const mockAxiosError = {
      isAxiosError: true,
      message: "Network Error",
      code: "503",
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    const result = handleRepositoryError(
      mockAxiosError,
      "Fallback msg",
    ) as MockedResponse;
    expect(result.type).toBe("BACK-ERROR");
    expect(result.errorCode).toBe(503);
    expect(result.message).toBe("Error when communicating with the back-end.");
  });

  it("should return APP-ERROR for non-Axios generic errors", () => {
    vi.spyOn(axios, "isAxiosError").mockReturnValue(false);
    const genericError = new Error("Generic fail");

    const result = handleRepositoryError(
      genericError,
      "Fallback fallback",
    ) as MockedResponse;
    expect(result.type).toBe("APP-ERROR");
    expect(result.errorCode).toBe(500);
    expect(result.message).toBe("Fallback fallback");
  });
});
