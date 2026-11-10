import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as ConfigurationRepository from "../api/ConfigurationRepository";
import type { Configuration } from "../domain/Entity/Configuration";
import { useConfigurationList } from "./useConfigurationList";

const mockPushToast = vi.fn();
vi.mock("@/shared/context/ToastContext", async () => ({
  useToast: () => ({
    pushToast: mockPushToast,
  }),
}));

// Mock ResponseModel class since it's commonly imported from components
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
  };
});

import { ResponseModel } from "@variamosple/variamos-components";

describe("useConfigurationList Hook Tests", () => {
  let queryConfigurationsSpy: import("vitest").MockInstance<
    typeof ConfigurationRepository.queryConfigurations
  >;
  let updateConfigurationSpy: import("vitest").MockInstance<
    typeof ConfigurationRepository.updateConfiguration
  >;

  const mockConfigs: Configuration[] = [
    {
      id: 1,
      key: "general.site_name",
      value: "VariaMos",
      type: "string",
      category: "general",
      requiresMfa: false,
      isSecret: false,
      environmentScope: "all",
      isReadOnly: false,
      targetServices: ["all"],
    },
    {
      id: 2,
      key: "security.password.min_length",
      value: 12,
      type: "number",
      category: "security",
      requiresMfa: true,
      isSecret: false,
      environmentScope: "all",
      isReadOnly: false,
      targetServices: ["variamos_ms_security"],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    const queryResponse = new ResponseModel<Configuration[]>("success");
    queryResponse.data = mockConfigs;

    queryConfigurationsSpy = vi
      .spyOn(ConfigurationRepository, "queryConfigurations")
      .mockResolvedValue(queryResponse);

    const updateResponse = new ResponseModel<Configuration>("success");
    updateResponse.data = {
      key: "general.site_name",
      value: "VariaMos",
      type: "string",
      category: "general",
      requiresMfa: false,
      isSecret: false,
      environmentScope: "all",
      isReadOnly: false,
      targetServices: ["all"],
    };

    updateConfigurationSpy = vi
      .spyOn(ConfigurationRepository, "updateConfiguration")
      .mockResolvedValue(updateResponse);
  });

  afterEach(() => {
    queryConfigurationsSpy.mockRestore();
    updateConfigurationSpy.mockRestore();
  });

  it("should query configurations and initialize sandbox lists on load", async () => {
    const { result } = renderHook(() => useConfigurationList());

    await waitFor(() => {
      expect(result.current.configurations).toHaveLength(2);
      expect(result.current.originalConfigs).toHaveLength(2);
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.modifiedKeys).toEqual([]);
  });

  it("should update values locally and flag state as dirty", async () => {
    const { result } = renderHook(() => useConfigurationList());

    await waitFor(() => {
      expect(result.current.configurations).toHaveLength(2);
    });

    act(() => {
      result.current.setLocalValue("general.site_name", "New Site Name");
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.modifiedKeys).toEqual(["general.site_name"]);
    expect(result.current.configurations[0].value).toBe("New Site Name");
    // Ensure original state is untouched
    expect(result.current.originalConfigs[0].value).toBe("VariaMos");
  });

  it("should revert all unsaved local changes on discard", async () => {
    const { result } = renderHook(() => useConfigurationList());

    await waitFor(() => {
      expect(result.current.configurations).toHaveLength(2);
    });

    act(() => {
      result.current.setLocalValue("general.site_name", "New Site Name");
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.discardChanges();
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.configurations[0].value).toBe("VariaMos");
  });

  it("should globally save all modified configurations and push a success toast", async () => {
    const { result } = renderHook(() => useConfigurationList());

    await waitFor(() => {
      expect(result.current.configurations).toHaveLength(2);
    });

    act(() => {
      result.current.setLocalValue("general.site_name", "New Site Name");
      result.current.setLocalValue("security.password.min_length", 16);
    });

    await act(async () => {
      await result.current.saveChanges();
    });

    expect(updateConfigurationSpy).toHaveBeenCalledTimes(2);
    expect(updateConfigurationSpy).toHaveBeenNthCalledWith(
      1,
      "general.site_name",
      "New Site Name",
    );
    expect(updateConfigurationSpy).toHaveBeenNthCalledWith(
      2,
      "security.password.min_length",
      16,
    );

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Configurations saved",
        variant: "success",
      }),
    );
  });

  it("saves every key despite a refusal, and keeps the refused edit with its reason", async () => {
    const { result } = renderHook(() => useConfigurationList());

    await waitFor(() => {
      expect(result.current.configurations).toHaveLength(2);
    });

    act(() => {
      result.current.setLocalValue("general.site_name", "New Site Name");
      result.current.setLocalValue("security.password.min_length", 16);
    });

    const errorResponse = new ResponseModel<Configuration>("error").withError(
      400,
      "Validation failed",
    );
    updateConfigurationSpy.mockResolvedValueOnce(errorResponse);

    await act(async () => {
      await result.current.saveChanges();
    });

    // The refusal of the first key does not stop the second
    expect(updateConfigurationSpy).toHaveBeenCalledTimes(2);
    expect(mockPushToast).toHaveBeenCalledWith({
      title: "1 of 2 configuration(s) not saved",
      message:
        "Saved: security.password.min_length. Not saved: general.site_name (Validation failed).",
      variant: "danger",
    });
    // Reloaded from the server, with the refused edit still on screen
    expect(queryConfigurationsSpy).toHaveBeenCalledTimes(2);
    expect(result.current.saveFailures).toEqual({
      "general.site_name": "Validation failed",
    });
    expect(result.current.modifiedKeys).toEqual(["general.site_name"]);
    expect(result.current.configurations[0].value).toBe("New Site Name");
  });

  it("forgets the refusals on discard", async () => {
    const { result } = renderHook(() => useConfigurationList());
    await waitFor(() => {
      expect(result.current.configurations).toHaveLength(2);
    });
    act(() => {
      result.current.setLocalValue("general.site_name", "New Site Name");
    });
    updateConfigurationSpy.mockResolvedValueOnce(
      new ResponseModel<Configuration>("error").withError(400, "Refused"),
    );
    await act(async () => {
      await result.current.saveChanges();
    });

    act(() => {
      result.current.discardChanges();
    });

    expect(result.current.saveFailures).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });
});
