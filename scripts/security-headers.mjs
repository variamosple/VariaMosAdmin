#!/usr/bin/env node
// Writes the security headers of the nginx server (EV-75 lot 3). The page
// calls the APIs named by the VITE_* variables of the build, so the content
// security policy is derived from the same values and follows them.
// Usage: node scripts/security-headers.mjs <output file>

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";

// Addresses the page fetches or opens a WebSocket to
const API_VARIABLES = [
  "VITE_ADMIN_API_URL",
  "VITE_ADMIN_WS_URL",
  "VITE_LANGUAGES_API_URL",
  "VITE_PROJECTS_API_URL",
  "VITE_NOTIFICATION_API_URL",
];

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
  return [...origins].sort();
}

export function contentSecurityPolicy(env) {
  const directives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `${GOOGLE_SIGN_IN}client`],
    // The Google sign-in script injects its own style element and attributes;
    // inline styles cannot run code, scripts stay strict
    "style-src": [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      `${GOOGLE_SIGN_IN}style`,
    ],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    // Bootstrap draws its icons as data: images; downloads use blob:
    "img-src": ["'self'", "data:", "blob:"],
    "connect-src": ["'self'", ...apiOrigins(env), GOOGLE_SIGN_IN],
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
 * The policy is only reported for now: a violation shows in the browser
 * console without blocking, until the list is confirmed in production.
 */
export function securityHeaders(env) {
  return [
    `add_header Content-Security-Policy-Report-Only "${contentSecurityPolicy(env)}" always;`,
    'add_header X-Content-Type-Options "nosniff" always;',
    'add_header X-Frame-Options "DENY" always;',
    'add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;',
    "",
  ].join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const output = process.argv[2];
  if (!output) {
    console.error("Usage: node scripts/security-headers.mjs <output file>");
    process.exit(1);
  }
  writeFileSync(
    output,
    securityHeaders(loadEnv("production", process.cwd(), "VITE_")),
  );
}
