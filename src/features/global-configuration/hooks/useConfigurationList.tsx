import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/shared/context/ToastContext";
import {
  queryConfigurations,
  updateConfiguration,
} from "../api/ConfigurationRepository";
import {
  announcementOfChanges,
  type ChangeAnnouncement,
} from "../domain/Entity/ChangeAnnouncement";
import type {
  Configuration,
  ConfigurationAnnouncement,
  ConfigurationValue,
} from "../domain/Entity/Configuration";

/** What a save did: the keys saved, those refused and why. */
interface SaveOutcome {
  saved: string[];
  savedAnnouncements: {
    key: string;
    announcement?: ConfigurationAnnouncement;
  }[];
  failures: Record<string, string>;
  /** The refused edits, kept on screen over the values loaded again. */
  keptEdits: Record<string, ConfigurationValue>;
}

// One request per key, in order; a refusal does not stop the others
const saveEach = async (configs: Configuration[]): Promise<SaveOutcome> => {
  const outcome: SaveOutcome = {
    saved: [],
    savedAnnouncements: [],
    failures: {},
    keptEdits: {},
  };
  for (const { key, value } of configs) {
    try {
      const response = await updateConfiguration(key, value);
      if (response.errorCode) {
        outcome.failures[key] =
          response.message ?? `Failed to update configuration '${key}'.`;
      } else {
        outcome.saved.push(key);
        outcome.savedAnnouncements.push({
          key,
          announcement: response.data?.announcement,
        });
      }
    } catch (err) {
      outcome.failures[key] = err instanceof Error ? err.message : "";
    }
    if (key in outcome.failures) outcome.keptEdits[key] = value;
  }
  return outcome;
};

const saveToastOf = ({ saved, failures }: SaveOutcome) => {
  const refused = Object.keys(failures);
  if (refused.length === 0) {
    return {
      title: "Configurations saved",
      message: `Successfully saved ${saved.length} configuration(s).`,
      variant: "success" as const,
    };
  }
  const refusalText = (key: string) => `${key} (${failures[key]})`;
  return {
    title: `${refused.length} of ${saved.length + refused.length} configuration(s) not saved`,
    message: [
      saved.length > 0 ? `Saved: ${saved.join(", ")}.` : "",
      `Not saved: ${refused.map(refusalText).join(", ")}.`,
    ]
      .filter(Boolean)
      .join(" "),
    variant: "danger" as const,
  };
};

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
              local.map((config) => {
                const kept = keptEdits[config.key];
                return kept === undefined ? config : { ...config, value: kept };
              }),
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
    void loadData();
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
      if (
        original &&
        JSON.stringify(original.value) !== JSON.stringify(local.value)
      ) {
        keys.push(local.key);
      }
    }
    return keys;
  }, [localConfigs, originalConfigs]);

  const isDirty = modifiedKeys.length > 0;

  /**
   * Saves every modified key, one request each, and says which were saved
   * and which were refused. A refusal does not stop the others, and the
   * refused edits stay on screen with their reason (UX-14). Answers the
   * announcement the saved settings suggest, if any (EV-115 lot A).
   */
  const saveChanges = async (): Promise<ChangeAnnouncement | null> => {
    if (modifiedKeys.length === 0) return null;
    setIsUpdating(true);
    const modified = modifiedKeys.flatMap((key) =>
      localConfigs.filter((c) => c.key === key).slice(0, 1),
    );
    const outcome = await saveEach(modified);
    setIsUpdating(false);
    setSaveFailures(outcome.failures);
    pushToast(saveToastOf(outcome));
    // What the server now holds, with the refused edits kept on top
    await loadData(outcome.keptEdits);
    return announcementOfChanges(outcome.savedAnnouncements);
  };

  return {
    configurations: localConfigs,
    originalConfigs,
    isLoading,
    isUpdating,
    isDirty,
    modifiedKeys,
    saveFailures,
    setLocalValue,
    discardChanges,
    saveChanges,
    refresh: () => loadData(),
  };
};
