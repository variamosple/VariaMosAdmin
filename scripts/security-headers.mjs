#!/usr/bin/env node
// Writes the security headers of the nginx server (EV-75 lot 3). The page
// calls the APIs named by the VITE_* variables of the build, so the content
// security policy is derived from the same values and follows them.
// Usage: node scripts/security-headers.mjs <output file>

import { writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";

// Addresses the page fetches or opens a WebSocket to
export const API_VARIABLES = [
  "VITE_ADMIN_API_URL",
  "VITE_ADMIN_WS_URL",
  "VITE_LANGUAGES_API_URL",
  "VITE_PROJECTS_API_URL",
  "VITE_NOTIFICATION_API_URL",
];

// Stands for the API origins in the template completed at container start
// (etc/runtime-config.sh), when the addresses are known
export const ORIGINS_PLACEHOLDER = "__API_ORIGINS__";

// Google sign-in: its script, button frame, style and calls
const GOOGLE_SIGN_IN = "https://accounts.google.com/gsi/";

/** Origins of the API addresses; a relative or invalid one is left out. */
export function apiOrigins(env) {
  const origins = new Set();
  for (const name of API_VARIABLES) {
    try {
      const { origin } = new URL(env[name] ?? "");
      if (origin !== "null") origins.add(origin);
    } catch {
      // A relative address is covered by 'self'
    }
  }
  // Code point order, as "LC_ALL=C sort" in etc/runtime-config.sh
  return [...origins].sort((a, b) => Number(a > b) - Number(a < b));
}

export function contentSecurityPolicy(env, origins = apiOrigins(env)) {
  const directives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `${GOOGLE_SIGN_IN}client`],
    // The Google sign-in script injects its own style element and attributes;
    // inline styles cannot run code, scripts stay strict
    "style-src": ["'self'", "'unsafe-inline'", `${GOOGLE_SIGN_IN}style`],
    // The Play font is served with the application (ADM-N45)
    "font-src": ["'self'"],
    // Bootstrap draws its icons as data: images; downloads use blob:
    "img-src": ["'self'", "data:", "blob:"],
    "connect-src": ["'self'", ...origins, GOOGLE_SIGN_IN],
    // Google sign-in button and the video of the About page
    "frame-src": [GOOGLE_SIGN_IN, "https://drive.google.com"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}

/**
 * The policy blocks what it does not list. It was only reported first, and
 * the production console showed no violation (2026-10-28).
 */
export function securityHeaders(env, origins = apiOrigins(env)) {
  return [
    `add_header Content-Security-Policy "${contentSecurityPolicy(env, origins)}" always;`,
    'add_header X-Content-Type-Options "nosniff" always;',
    'add_header X-Frame-Options "DENY" always;',
    'add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;',
    "",
  ].join("\n");
}

/**
 * The file to write, inside the project only: the build writes
 * security-headers.conf at its root, and nothing else is expected.
 */
export function outputPath(argument, root) {
  if (!argument) return null;
  const path = resolve(root, argument);
  const fromRoot = relative(root, path);
  if (!fromRoot || fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    return null;
  }
  return path;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const output = outputPath(process.argv[2], process.cwd());
  if (!output) {
    console.error(
      "Usage: node scripts/security-headers.mjs <output file inside the project>",
    );
    process.exit(1);
  }
  writeFileSync(
    output,
    securityHeaders(loadEnv("production", process.cwd(), "VITE_")),
  );
}
