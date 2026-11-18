import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runInNewContext } from "node:vm";
import {
  buildDefaults,
  headersTemplate,
  RUNTIME_VARIABLES,
  shellQuote,
} from "./runtime-config.mjs";
import { securityHeaders } from "./security-headers.mjs";

const SCRIPT = resolve(import.meta.dirname, "../etc/runtime-config.sh");

const BUILD = {
  VITE_ADMIN_API_URL: "https://app.example.org/variamos_ms_admin",
  VITE_ADMIN_WS_URL: "wss://app.example.org/variamos_ms_admin/ws",
  VITE_LANGUAGES_API_URL: "https://app.example.org/variamos_ms_languages",
  VITE_PROJECTS_API_URL: "https://projects.example.org/vms_projects",
  VITE_NOTIFICATION_API_URL: "https://app.example.org",
  VITE_GOOGLE_CLIENT_ID: "client-id.apps.example",
  VITE_GOOGLE_REDIRECT_URI: "https://app.example.org/variamos_admin/",
  VITE_LOGIN_URL: "https://app.example.org/variamos_admin/#/login",
  VITE_HOME_PAGE: "https://app.example.org/",
};

let dir;

/** Runs the start-up script on the output of the build, with these variables. */
function start(build, variables = {}) {
  dir = mkdtempSync(join(tmpdir(), "runtime-config-"));
  writeFileSync(join(dir, "build.env"), buildDefaults(build));
  writeFileSync(
    join(dir, "security-headers.conf.template"),
    headersTemplate(build),
  );
  execFileSync("sh", [SCRIPT], {
    env: {
      PATH: process.env.PATH,
      RUNTIME_CONFIG_DIR: dir,
      RUNTIME_CONFIG_JS: join(dir, "config.js"),
      RUNTIME_SECURITY_HEADERS: join(dir, "security-headers.conf"),
      ...variables,
    },
  });
  // Run as the browser would: config.js must be valid JavaScript
  const window = {};
  runInNewContext(readFileSync(join(dir, "config.js"), "utf8"), { window });
  return {
    config: window.__VARIAMOS_CONFIG__,
    headers: readFileSync(join(dir, "security-headers.conf"), "utf8"),
  };
}

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe("configuration read at container start", () => {
  it("serves the values and headers of the build when the container gives none", () => {
    const { config, headers } = start(BUILD);

    expect(config).toEqual(BUILD);
    expect(headers).toBe(securityHeaders(BUILD));
  });

  it("takes the addresses of the container, and their origins in the policy", () => {
    const kit = {
      VITE_ADMIN_API_URL: "http://localhost:8090/variamos_ms_admin",
      VITE_ADMIN_WS_URL: "ws://localhost:8090/variamos_ms_admin/ws",
      VITE_LANGUAGES_API_URL: "http://localhost:8090/variamos_ms_languages",
      VITE_PROJECTS_API_URL: "http://localhost:8090/vms_projects",
      VITE_NOTIFICATION_API_URL: "http://localhost:8090",
      VITE_GOOGLE_CLIENT_ID: "",
    };

    const { config, headers } = start(BUILD, kit);

    expect(config.VITE_ADMIN_API_URL).toBe(kit.VITE_ADMIN_API_URL);
    expect(config.VITE_HOME_PAGE).toBe(BUILD.VITE_HOME_PAGE);
    // Not given: the value of the build; given empty: empty
    expect(config.VITE_GOOGLE_REDIRECT_URI).toBe(
      BUILD.VITE_GOOGLE_REDIRECT_URI,
    );
    expect(config.VITE_GOOGLE_CLIENT_ID).toBe("");
    expect(headers).toBe(securityHeaders({ ...BUILD, ...kit }));
    expect(headers).toContain(
      "connect-src 'self' http://localhost:8090 ws://localhost:8090 https://accounts.google.com/gsi/;",
    );
  });

  it("gives the same origins as the build for unusual addresses", () => {
    const odd = {
      ...BUILD,
      VITE_ADMIN_API_URL: "HTTPS://User@App.Example.org:443/admin",
      VITE_ADMIN_WS_URL: "ws://app.example.org:80/ws",
      VITE_LANGUAGES_API_URL: "/variamos_ms_languages",
      VITE_PROJECTS_API_URL: "https://app.example.org:8443/projects",
      VITE_NOTIFICATION_API_URL: "not an address",
    };

    expect(start(odd).headers).toBe(securityHeaders(odd));
  });

  it("keeps only the page origin and Google when no address is set", () => {
    const { headers } = start({});

    expect(headers).toBe(securityHeaders({}));
  });

  it("writes quotes and backslashes as valid JavaScript", () => {
    const { config } = start(BUILD, {
      VITE_HOME_PAGE: String.raw`https://x.example/"quoted"\path`,
    });

    expect(config.VITE_HOME_PAGE).toBe(
      String.raw`https://x.example/"quoted"\path`,
    );
  });

  it("lists every value read by the page", () => {
    expect(RUNTIME_VARIABLES).toEqual(Object.keys(BUILD));
  });

  it("quotes values for the shell", () => {
    expect(shellQuote("it's $HOME")).toBe(`'it'\\''s $HOME'`);
  });
});
