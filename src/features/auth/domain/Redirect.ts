/**
 * The address to go to after sign-in, or undefined when it is not a web
 * address. The API accepts any address whose origin reads "null", which
 * includes javascript: and data: ones: assigned to the location, a
 * javascript: address runs its script on this site.
 */
export const safeRedirectOf = (url: string | null | undefined) => {
  if (!url) return undefined;
  try {
    const { protocol } = new URL(url, window.location.href);
    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
};
