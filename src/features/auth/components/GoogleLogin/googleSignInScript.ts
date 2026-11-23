export const GOOGLE_SIGN_IN_SCRIPT = "https://accounts.google.com/gsi/client";

/**
 * Adds the Google sign-in script once, from the pages that show its button,
 * instead of loading it on every page of the administration (ADM-N45).
 */
export function loadGoogleSignInScript(doc: Document = document): void {
  if (doc.querySelector(`script[src="${GOOGLE_SIGN_IN_SCRIPT}"]`)) return;
  const script = doc.createElement("script");
  script.src = GOOGLE_SIGN_IN_SCRIPT;
  script.async = true;
  doc.head.appendChild(script);
}
