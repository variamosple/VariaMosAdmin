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
 *
 * Leaving the page cancels the files still loading, and Safari (WebKit)
 * reports each of them as a load error: a reload then would replace the
 * page the user is going to. From the start of leaving, errors are ignored;
 * a page shown again from the back-forward cache listens to them again.
 */
export const reloadOnStaleFiles = (
  win: ReloadTarget = window,
  now: () => number = Date.now,
): void => {
  let leaving = false;
  const leave = () => {
    leaving = true;
  };
  win.addEventListener("beforeunload", leave);
  win.addEventListener("pagehide", leave);
  win.addEventListener("pageshow", (event) => {
    if ("persisted" in event && event.persisted) leaving = false;
  });

  win.addEventListener("vite:preloadError", (event) => {
    if (leaving) return;
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
