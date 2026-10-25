export const RELOADED_AT_KEY = "variamos-admin:stale-files-reloaded-at";
const MIN_DELAY_MS = 10_000;

export interface ReloadTarget extends EventTarget {
  sessionStorage: Pick<Storage, "getItem" | "setItem">;
  location: Pick<Location, "reload">;
}

/**
 * After a deployment, a tab left open asks for page files that no longer
 * exist (T-30). Reload once to get the new ones. A second failure soon
 * after is shown as is: the files are then really missing, and reloading
 * again would loop.
 */
export const reloadOnStaleFiles = (
  win: ReloadTarget = window,
  now: () => number = Date.now,
): void => {
  win.addEventListener("vite:preloadError", (event) => {
    try {
      const last = Number(win.sessionStorage.getItem(RELOADED_AT_KEY)) || 0;
      if (now() - last < MIN_DELAY_MS) return;
      win.sessionStorage.setItem(RELOADED_AT_KEY, String(now()));
    } catch {
      // Without storage, a reload could loop: leave the error shown
      return;
    }
    event.preventDefault();
    win.location.reload();
  });
};
