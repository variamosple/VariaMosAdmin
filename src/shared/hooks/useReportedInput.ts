import { useEffect } from "react";

/**
 * Tells the form around a part of it whether that part holds unsaved input
 * (isUnsavedInput), so that closing the whole form asks first. Gone, the
 * part holds nothing. `onHoldsInputChange` should be stable, as a state
 * setter is.
 */
export const useReportedInput = (
  holdsInput: boolean,
  onHoldsInputChange?: (holdsInput: boolean) => void,
) => {
  useEffect(() => {
    onHoldsInputChange?.(holdsInput);
    return () => onHoldsInputChange?.(false);
  }, [holdsInput, onHoldsInputChange]);
};
