import * as z from "zod/mini";
import { noData, parseResponse } from "./parseResponse";

const countSchema = z.looseObject({ count: z.number() });
const FAILURE = "Could not count.";

describe("parseResponse (EV-97 lot 6c)", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("returns the checked data of a conforming response", () => {
    const response = parseResponse(
      countSchema,
      { transactionId: "count", data: { count: 3, extra: true } },
      FAILURE,
    );

    expect(response.errorCode).toBeFalsy();
    expect(response.transactionId).toBe("count");
    expect(response.data).toEqual({ count: 3, extra: true });
  });

  it("gives an error, never a partial object, for malformed data", () => {
    const response = parseResponse(
      countSchema,
      { data: { count: "3" } },
      FAILURE,
    );

    expect(response).toMatchObject({
      errorCode: 500,
      message: FAILURE,
    });
    expect(response.data).toBeFalsy();
  });

  it("logs the path of the problem, never the value", () => {
    parseResponse(countSchema, { data: { count: "secret-42" } }, FAILURE);

    const logged = consoleError.mock.calls.flat().join(" ");
    expect(logged).toContain("data.count");
    expect(logged).not.toContain("secret-42");
  });

  it("refuses a body that is not an envelope, such as an HTML page", () => {
    const response = parseResponse(countSchema, "<html></html>", FAILURE);

    expect(response.errorCode).toBe(500);
  });

  it("passes on an error the server answered with a success status", () => {
    const response = parseResponse(
      countSchema,
      { errorCode: "INVALID_INPUT", message: "Invalid audience type." },
      FAILURE,
    );

    expect(response.errorCode).toBe("INVALID_INPUT");
    expect(response.message).toBe("Invalid audience type.");
  });

  it("accepts a response without data where none is expected", () => {
    const response = parseResponse(
      noData,
      { message: "Notification dispatched successfully." },
      FAILURE,
    );

    expect(response.errorCode).toBeFalsy();
    expect(response.message).toBe("Notification dispatched successfully.");
  });
});
