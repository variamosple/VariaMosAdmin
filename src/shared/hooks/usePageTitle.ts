import { useEffect } from "react";

const APP_TITLE = "VariaMos";

/**
 * Names the browser tab, the history entry and the page announced by a
 * screen reader after the screen (UX-35). The former title comes back when
 * the screen goes away. Without a title, the tab keeps the application name.
 */
export const usePageTitle = (title?: string) => {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} — ${APP_TITLE}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
};
