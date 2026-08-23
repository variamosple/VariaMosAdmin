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

describe("useConfigurationList Hook Tests", () => {
  let queryConfigurationsSpy: any;
  let updateConfigurationSpy: any;

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

    queryConfigurationsSpy = vi
      .spyOn(ConfigurationRepository, "queryConfigurations")
      .mockResolvedValue({
        data: mockConfigs,
        type: "success",
      } as any);

    updateConfigurationSpy = vi
      .spyOn(ConfigurationRepository, "updateConfiguration")
      .mockResolvedValue({
        data: {},
        type: "success",
      } as any);
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

  it("should halt saves on first error and refresh data from repository", async () => {
    const { result } = renderHook(() => useConfigurationList());

    await waitFor(() => {
      expect(result.current.configurations).toHaveLength(2);
    });

    act(() => {
      result.current.setLocalValue("general.site_name", "New Site Name");
      result.current.setLocalValue("security.password.min_length", 16);
    });

    updateConfigurationSpy.mockResolvedValueOnce({
      errorCode: 400,
      message: "Validation failed",
      type: "error",
    } as any);

    await act(async () => {
      await result.current.saveChanges();
    });

    // Should stop at first save error, so updateConfiguration called only once
    expect(updateConfigurationSpy).toHaveBeenCalledTimes(1);

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Configuration save error",
        message: "Validation failed",
        variant: "danger",
      }),
    );
  });
});
