import axios from "axios";
import { handleRepositoryError } from "./RepositoryUtils";

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
  };
});

describe("RepositoryUtils handleRepositoryError", () => {
  let consoleSpy: import('vitest').MockInstance;

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
      message: "Request failed",
      response: {
        data: mockResponseData,
      },
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    const result = handleRepositoryError(mockAxiosError, "Fallback msg");
    expect(result).toEqual(mockResponseData);
  });

  it("should return formatted BACK-ERROR if no response data is in Axios error", () => {
    const mockAxiosError = {
      isAxiosError: true,
      message: "Network Error",
      code: "503",
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    const result = handleRepositoryError(mockAxiosError, "Fallback msg") as any;
    expect(result.type).toBe("BACK-ERROR");
    expect(result.errorCode).toBe(503);
    expect(result.message).toBe("Error when communicating with the back-end.");
  });

  it("should return APP-ERROR for non-Axios generic errors", () => {
    vi.spyOn(axios, "isAxiosError").mockReturnValue(false);
    const genericError = new Error("Generic fail");

    const result = handleRepositoryError(genericError, "Fallback fallback") as any;
    expect(result.type).toBe("APP-ERROR");
    expect(result.errorCode).toBe(500);
    expect(result.message).toBe("Fallback fallback");
  });
});
