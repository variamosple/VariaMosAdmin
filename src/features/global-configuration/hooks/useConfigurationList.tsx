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

  // Keys refused at the last save, with the reason: their edits stay on
  // screen so that they can be corrected and saved again (UX-14)
  const [saveFailures, setSaveFailures] = useState<Record<string, string>>({});

  /**
   * Loads the configurations. Edits passed in `keptEdits` stay on screen
   * over the values just loaded.
   */
  const loadData = useCallback(
    (keptEdits: Record<string, ConfigurationValue> = {}) => {
      setIsLoading(true);
      return queryConfigurations()
        .then((response) => {
          if (!response.errorCode && response.data) {
            setOriginalConfigs(response.data);
            // Deep clone configurations for local sandbox edits
            const local: Configuration[] = JSON.parse(
              JSON.stringify(response.data),
            );
            setLocalConfigs(
              local.map((config) =>
                config.key in keptEdits
                  ? { ...config, value: keptEdits[config.key] }
                  : config,
              ),
            );
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
    },
    [pushToast],
  );

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
    setSaveFailures({});
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

  // Modified keys marked sensitive: the page asks for a confirmation first
  const sensitiveModifiedKeys = useMemo(
    () =>
      modifiedKeys.filter(
        (key) => localConfigs.find((c) => c.key === key)?.requiresMfa,
      ),
    [modifiedKeys, localConfigs],
  );

  /**
   * Saves every modified key, one request each, and says which were saved
   * and which were refused. A refusal does not stop the others, and the
   * refused edits stay on screen with their reason (UX-14).
   */
  const saveChanges = async () => {
    if (modifiedKeys.length === 0) return;
    setIsUpdating(true);

    const saved: string[] = [];
    const failures: Record<string, string> = {};
    const keptEdits: Record<string, ConfigurationValue> = {};

    for (const key of modifiedKeys) {
      const localConfig = localConfigs.find((c) => c.key === key);
      if (!localConfig) continue;

      try {
        const response = await updateConfiguration(key, localConfig.value);
        if (!response.errorCode) {
          saved.push(key);
        } else {
          failures[key] =
            response.message ?? `Failed to update configuration '${key}'.`;
        }
      } catch (err) {
        failures[key] = (err as Error).message;
      }
      if (key in failures) keptEdits[key] = localConfig.value;
    }

    setIsUpdating(false);
    setSaveFailures(failures);

    const refused = Object.keys(failures);
    if (refused.length > 0) {
      pushToast({
        title: `${refused.length} of ${saved.length + refused.length} configuration(s) not saved`,
        message: [
          saved.length > 0 ? `Saved: ${saved.join(", ")}.` : "",
          `Not saved: ${refused.map((key) => `${key} (${failures[key]})`).join(", ")}.`,
        ]
          .filter(Boolean)
          .join(" "),
        variant: "danger",
      });
    } else {
      pushToast({
        title: "Configurations saved",
        message: `Successfully saved ${saved.length} configuration(s).`,
        variant: "success",
      });
    }
    // What the server now holds, with the refused edits kept on top
    await loadData(keptEdits);
  };

  return {
    configurations: localConfigs,
    originalConfigs,
    isLoading,
    isUpdating,
    isDirty,
    modifiedKeys,
    sensitiveModifiedKeys,
    saveFailures,
    setLocalValue,
    discardChanges,
    saveChanges,
    refresh: () => loadData(),
  };
};
