/**
 * Loads a page fully, so that the session library reads the new session at
 * start-up (it has no other way to learn about it). A change of the hash
 * alone would not reload the application, hence the explicit reload; an
 * address without hash is a full navigation already.
 */
export const pageLoader = {
  load(url: string): void {
    const target = new URL(url || "/", window.location.href);
    const { location } = window;
    const hashOnly =
      target.hash !== "" &&
      target.origin === location.origin &&
      target.pathname === location.pathname &&
      target.search === location.search;
    if (hashOnly) {
      location.hash = target.hash;
      location.reload();
    } else {
      location.assign(target.href);
    }
  },
};
