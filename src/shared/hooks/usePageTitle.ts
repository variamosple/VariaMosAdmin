import { useEffect } from "react";
import { useSiteName } from "./useSiteName";

/**
 * Names the browser tab, the history entry and the page announced by a
 * screen reader after the screen (UX-35), followed by the site name set on
 * the configuration screen (EV-87 lot 2). When the screen goes away, the tab
 * shows the site name alone. Without a title, the tab is left as it is.
 */
export const usePageTitle = (title?: string) => {
  const siteName = useSiteName();
  useEffect(() => {
    if (!title) return;
    document.title = `${title} — ${siteName}`;
    return () => {
      document.title = siteName;
    };
  }, [title, siteName]);
};
