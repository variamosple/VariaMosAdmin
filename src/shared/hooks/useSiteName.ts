import { useSyncExternalStore } from "react";
import { requestPublicSettings } from "@/shared/api/ConfigRepository";

/** The name the tabs show until the server gives the configured one. */
const DEFAULT_SITE_NAME = "VariaMos";

let siteName = DEFAULT_SITE_NAME;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const setSiteName = (name: string) => {
  // A tab without a screen title shows the site name alone
  if (document.title === siteName) document.title = name;
  siteName = name;
  for (const listener of listeners) listener();
};

/** The site name set on the configuration screen (EV-87 lot 2). */
export const useSiteName = (): string =>
  useSyncExternalStore(subscribe, () => siteName);

/**
 * Reads the configured site name once, at start-up. When the server cannot
 * give it, the tabs keep VariaMos: nothing is shown to the user.
 */
export const loadSiteName = async (): Promise<void> => {
  // An error response carries no data
  const { data } = await requestPublicSettings();
  if (data) setSiteName(data.siteName);
};

/** For the tests: back to the name before any load. */
export const resetSiteName = (): void => {
  setSiteName(DEFAULT_SITE_NAME);
};
