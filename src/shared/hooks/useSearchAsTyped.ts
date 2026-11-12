import { useEffect, useRef } from "react";

// The pause in the typing before the list is searched
const SEARCH_DELAY_MS = 500;

/**
 * Searches once the typing pauses, after a field of the search form
 * changed. `search` is the form's submit (react-hook-form handleSubmit).
 */
export const useSearchAsTyped = <T>(
  isDirty: boolean,
  search: () => Promise<T>,
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isDirty) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      void search();
    }, SEARCH_DELAY_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, search]);
};
