import { useEffect, useState } from "react";
import { getMyPreferences } from "@/shared/api/PreferencesRepository";
import { browserTimeZone, isKnownTimeZone } from "@/shared/domain/TimeZone";

/**
 * The time zone to show times in (EV-115 lot C): the one chosen in "My
 * account", else the browser's. Until the choice is read, or if it cannot
 * be, the browser's.
 */
export const useTimeZone = () => {
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    getMyPreferences().then((response) => {
      const zone = response.data?.timeZone ?? null;
      // A zone this browser does not know would fail every conversion
      if (current) setChosen(zone && isKnownTimeZone(zone) ? zone : null);
    });
    return () => {
      current = false;
    };
  }, []);

  return { timeZone: chosen ?? browserTimeZone(), chosen, setChosen };
};
