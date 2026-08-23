import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/shared/context/ToastContext";
import {
  queryConfigurations,
  updateConfiguration,
} from "../api/ConfigurationRepository";
import type {
  Configuration,
  ConfigurationValue,
} from "../domain/Entity/Configuration";

export const useConfigurationList = () => {
  const [originalConfigs, setOriginalConfigs] = useState<Configuration[]>([]);
  const [localConfigs, setLocalConfigs] = useState<Configuration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { pushToast } = useToast();

  const loadData = useCallback(() => {
    setIsLoading(true);
    return queryConfigurations()
      .then((response) => {
        if (!response.errorCode && response.data) {
          setOriginalConfigs(response.data);
          // Deep clone configurations for local sandbox edits
          setLocalConfigs(JSON.parse(JSON.stringify(response.data)));
        } else {
          pushToast({
            title: "Configuration query error",
            message: response.message ?? "An error occurred",
            variant: "danger",
          });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [pushToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update a value locally in the sandbox
  const setLocalValue = (key: string, value: ConfigurationValue) => {
    setLocalConfigs((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value } : c)),
    );
  };

  // Discard all sandbox changes
  const discardChanges = () => {
    setLocalConfigs(JSON.parse(JSON.stringify(originalConfigs)));
  };

  // Compute modified keys
  const modifiedKeys = useMemo(() => {
    const keys: string[] = [];
    for (const local of localConfigs) {
      const original = originalConfigs.find((o) => o.key === local.key);
      if (original) {
        if (JSON.stringify(original.value) !== JSON.stringify(local.value)) {
          keys.push(local.key);
        }
      }
    }
    return keys;
  }, [localConfigs, originalConfigs]);

  const isDirty = modifiedKeys.length > 0;

  // Save all sandbox changes to backend
  const saveChanges = async () => {
    if (modifiedKeys.length === 0) return;
    setIsUpdating(true);

    let successCount = 0;
    let failedKey: string | null = null;
    let failureMsg = "An error occurred during save.";

    for (const key of modifiedKeys) {
      const localConfig = localConfigs.find((c) => c.key === key);
      if (!localConfig) continue;

      try {
        const response = await updateConfiguration(key, localConfig.value);
        if (!response.errorCode) {
          successCount++;
        } else {
          failedKey = key;
          failureMsg =
            response.message ?? `Failed to update configuration '${key}'.`;
          break; // Stop at first error (e.g. MFA challenge or validation error)
        }
      } catch (err) {
        failedKey = key;
        failureMsg = (err as Error).message;
        break;
      }
    }

    setIsUpdating(false);

    if (failedKey) {
      pushToast({
        title: "Configuration save error",
        message: failureMsg,
        variant: "danger",
      });
      // Refresh configurations to ensure local state matches database reality
      loadData();
    } else {
      pushToast({
        title: "Configurations saved",
        message: `Successfully saved ${successCount} configuration(s).`,
        variant: "success",
      });
      loadData();
    }
  };

  return {
    configurations: localConfigs,
    originalConfigs,
    isLoading,
    isUpdating,
    isDirty,
    modifiedKeys,
    setLocalValue,
    discardChanges,
    saveChanges,
    refresh: loadData,
  };
};
