import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import {
  BACK_END_ERROR_MESSAGE,
  toErrorResponse,
  UNREACHABLE_ERROR_CODE,
} from "./toErrorResponse";

const failedWith = (status: number, data: object | string | null) =>
  new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
    data,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse);

describe("toErrorResponse", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the error body written by the server", () => {
    const response = toErrorResponse(
      failedWith(400, {
        transactionId: "createBug",
        errorCode: "INVALID_INPUT",
        message: "Bug title cannot be empty.",
      }),
      "Fallback",
    );

    expect(response).toMatchObject({
      transactionId: "createBug",
      errorCode: "INVALID_INPUT",
      message: "Bug title cannot be empty.",
    });
  });

  it("takes the HTTP status as code when the body has none", () => {
    const response = toErrorResponse(
      failedWith(404, { message: "Language not found." }),
      "Fallback",
    );

    expect(response.errorCode).toBe(404);
    expect(response.message).toBe("Language not found.");
  });

  it.each([
    [
      "an HTML page from the proxy",
      "<html><body>502 Bad Gateway</body></html>",
    ],
    ["an empty body", ""],
    ["a body without code or message", { error: "boom" }],
    ["a list", []],
  ])("answers an error with the status for %s", (_label, data) => {
    const response = toErrorResponse(failedWith(502, data), "Fallback");

    expect(response.errorCode).toBe(502);
    expect(response.message).toBe(BACK_END_ERROR_MESSAGE);
  });

  it.each([
    ["the network is down", "ERR_NETWORK"],
    ["the request timed out", "ECONNABORTED"],
  ])("answers an error when %s", (_label, code) => {
    const response = toErrorResponse(
      new AxiosError("Network Error", code),
      "Fallback",
    );

    // parseInt(code) used to give NaN, which pages read as a success
    expect(response.errorCode).toBe(UNREACHABLE_ERROR_CODE);
    expect(response.message).toBe(BACK_END_ERROR_MESSAGE);
  });

  it("answers the fallback message for an error outside the request", () => {
    const response = toErrorResponse(
      new TypeError("x is undefined"),
      "Could not load the roles.",
    );

    expect(response.errorCode).toBe(500);
    expect(response.message).toBe("Could not load the roles.");
  });
});
