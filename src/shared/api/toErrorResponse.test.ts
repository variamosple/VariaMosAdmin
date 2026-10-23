import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { SYSTEM_ERROR_MESSAGE, UNREACHABLE_MESSAGE } from "./errorMessages";
import { toErrorResponse, UNREACHABLE_ERROR_CODE } from "./toErrorResponse";

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

  it("keeps the error body and the message of an expected error", () => {
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

  it("shows the generic message for a server error, whatever its text", () => {
    const response = toErrorResponse(
      failedWith(500, { errorCode: 500, message: "Internal Server Error" }),
      "Fallback",
    );

    expect(response.errorCode).toBe(500);
    expect(response.message).toBe(SYSTEM_ERROR_MESSAGE);
  });

  it.each([
    ["an HTML page from the proxy", 502, UNREACHABLE_MESSAGE],
    ["a gateway timeout", 504, UNREACHABLE_MESSAGE],
    ["an empty body", 500, SYSTEM_ERROR_MESSAGE],
    ["a body without code or message", 400, SYSTEM_ERROR_MESSAGE],
  ])("answers an error with the status for %s", (_label, status, message) => {
    const body = status === 502 ? "<html>502 Bad Gateway</html>" : "";
    const response = toErrorResponse(
      failedWith(status, _label.includes("without") ? { error: "x" } : body),
      "Fallback",
    );

    expect(response.errorCode).toBe(status);
    expect(response.message).toBe(message);
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
    expect(response.message).toBe(UNREACHABLE_MESSAGE);
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
