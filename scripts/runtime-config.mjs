#!/usr/bin/env node
// Prepares the configuration that the container completes at start-up
// (SPC-2026-11-18-001, lot A1). The build keeps its VITE_* values as
// defaults, and a template of the security headers whose API origins are
// filled in at start-up. etc/runtime-config.sh then writes config.js and the
// headers from the variables of the container, or from these defaults: a
// container started without variables serves what the build gave.
// Usage: node scripts/runtime-config.mjs <output folder inside the project>

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";
import {
  API_VARIABLES,
  ORIGINS_PLACEHOLDER,
  outputPath,
  securityHeaders,
} from "./security-headers.mjs";

// Every address or identifier the page reads from AppConfig
export const RUNTIME_VARIABLES = [
  ...API_VARIABLES,
  "VITE_GOOGLE_CLIENT_ID",
  "VITE_GOOGLE_REDIRECT_URI",
  "VITE_LOGIN_URL",
  "VITE_HOME_PAGE",
];

/** A value for a POSIX shell, between single quotes. */
export function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

/** build.env: sourced by etc/runtime-config.sh. */
export function buildDefaults(env) {
  return [
    `RUNTIME_VARIABLES=${shellQuote(RUNTIME_VARIABLES.join(" "))}`,
    `API_VARIABLES=${shellQuote(API_VARIABLES.join(" "))}`,
    ...RUNTIME_VARIABLES.map(
      (name) => `BUILD_${name}=${shellQuote(env[name] ?? "")}`,
    ),
    "",
  ].join("\n");
}

/** The security headers, with the API origins left to the start-up. */
export function headersTemplate(env) {
  return securityHeaders(env, [ORIGINS_PLACEHOLDER]);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const output = outputPath(process.argv[2], process.cwd());
  if (!output) {
    console.error(
      "Usage: node scripts/runtime-config.mjs <output folder inside the project>",
    );
    process.exit(1);
  }
  const env = loadEnv("production", process.cwd(), "VITE_");
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, "build.env"), buildDefaults(env));
  writeFileSync(
    join(output, "security-headers.conf.template"),
    headersTemplate(env),
  );
}
