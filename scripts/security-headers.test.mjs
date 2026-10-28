import {
  apiOrigins,
  contentSecurityPolicy,
  securityHeaders,
} from "./security-headers.mjs";

const directive = (policy, name) =>
  policy
    .split("; ")
    .find((d) => d.startsWith(`${name} `))
    ?.split(" ")
    .slice(1);

describe("security headers", () => {
  it("allows the origins of the API addresses, each once", () => {
    expect(
      apiOrigins({
        VITE_ADMIN_API_URL: "https://api.example.com/admin",
        VITE_ADMIN_WS_URL: "wss://api.example.com/ws/logs",
        VITE_LANGUAGES_API_URL: "https://languages.example.com/v1",
        VITE_PROJECTS_API_URL: "/projects",
        VITE_NOTIFICATION_API_URL: "https://api.example.com/notifications",
      }),
    ).toEqual([
      "https://api.example.com",
      "https://languages.example.com",
      "wss://api.example.com",
    ]);
  });

  it("keeps only the page origin and Google when no address is set", () => {
    expect(directive(contentSecurityPolicy({}), "connect-src")).toEqual([
      "'self'",
      "https://accounts.google.com/gsi/",
    ]);
  });

  it("forbids framing, plugins and other base addresses", () => {
    const policy = contentSecurityPolicy({});

    expect(directive(policy, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(policy, "object-src")).toEqual(["'none'"]);
    expect(directive(policy, "base-uri")).toEqual(["'self'"]);
    expect(directive(policy, "script-src")).toEqual([
      "'self'",
      "https://accounts.google.com/gsi/client",
    ]);
  });

  it("enforces the policy, and sends the other headers", () => {
    const headers = securityHeaders({
      VITE_ADMIN_API_URL: "https://api.example.com",
    });

    expect(headers).toContain(
      'add_header Content-Security-Policy "default-src',
    );
    expect(headers).toContain("https://api.example.com https://accounts");
    expect(headers).toContain(
      'add_header X-Content-Type-Options "nosniff" always;',
    );
    expect(headers).toContain('add_header X-Frame-Options "DENY" always;');
    // A report-only header would let a violation through
    expect(headers).not.toContain("Report-Only");
  });
});
