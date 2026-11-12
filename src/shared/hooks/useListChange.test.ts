import { act, renderHook } from "@testing-library/react";
import { ResponseModel } from "@variamosple/variamos-components";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resultToastOf, useListChange } from "./useListChange";

const pushToast = vi.fn();
vi.mock("@/shared/context/ToastContext", () => ({
  useToast: () => ({ pushToast, removeToast: vi.fn() }),
}));

// The ResponseModel of the tests (setupTests.ts): withError sets the code
const succeeded = () => new ResponseModel<string>("t");
const failed = (message = "") =>
  new ResponseModel<string>("t").withError(400, message);

describe("resultToastOf", () => {
  const messages = { title: "Role edit", success: "Role updated" };

  it("says the success", () => {
    expect(resultToastOf(succeeded(), messages)).toEqual({
      title: "Role edit",
      message: "Role updated",
      variant: "success",
    });
  });

  it("gives the reason of the server, or a default one", () => {
    expect(resultToastOf(failed("Name taken"), messages)).toEqual({
      title: "Role edit",
      message: "Name taken",
      variant: "danger",
    });
    expect(resultToastOf(failed(""), messages).message).toBe(
      "An error occurred",
    );
    expect(
      resultToastOf(failed(), {
        ...messages,
        failure: "Failed to edit",
        failureTitle: "Edit failed",
      }),
    ).toEqual({
      title: "Edit failed",
      message: "Failed to edit",
      variant: "danger",
    });
  });
});

describe("useListChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the page again and closes the dialog once the change is made", async () => {
    const refresh = vi.fn();
    const onSuccess = vi.fn();
    const setBusy = vi.fn();
    const { result } = renderHook(() => useListChange(refresh));

    let response: ResponseModel<string> | undefined;
    await act(async () => {
      response = await result.current({
        request: () => Promise.resolve(succeeded()),
        messages: { title: "Role create", success: "Role created" },
        onSuccess,
        setBusy,
      });
    });

    expect(response?.errorCode).toBeFalsy();
    expect(refresh).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(setBusy.mock.calls).toEqual([[true], [false]]);
    expect(pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Role created", variant: "success" }),
    );
  });

  it("keeps the page and the dialog when the change fails", async () => {
    const refresh = vi.fn();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useListChange(refresh));

    await act(async () => {
      await result.current({
        request: () => Promise.resolve(failed("Refused")),
        messages: { title: "Role create", success: "Role created" },
        onSuccess,
      });
    });

    expect(refresh).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Refused", variant: "danger" }),
    );
  });

  it("is no longer busy when the request throws", async () => {
    const setBusy = vi.fn();
    const { result } = renderHook(() => useListChange(vi.fn()));

    await act(async () => {
      await expect(
        result.current({
          request: () => Promise.reject(new Error("offline")),
          messages: { title: "Role create", success: "Role created" },
          setBusy,
        }),
      ).rejects.toThrow("offline");
    });

    expect(setBusy).toHaveBeenLastCalledWith(false);
    expect(pushToast).not.toHaveBeenCalled();
  });
});
