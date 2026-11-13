import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    pool: "forks",
    // Since Node 25, Node has its own localStorage, undefined without a storage
    // file, and Vitest keeps it instead of the one of jsdom. The tests run
    // browser code: turn Node's off in the workers. Remove once Vitest copies
    // localStorage from jsdom itself.
    execArgv: ["--no-experimental-webstorage"],
    // Globals and variables stubbed by vi.stubGlobal and vi.stubEnv come back
    // after each test, whatever the test does (EV-53)
    unstubGlobals: true,
    unstubEnvs: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.stryker-tmp/**",
      "**/strykerTmp/**",
      // The end-to-end tests at the root, not the helpers of src/shared/tests
      "tests/**",
      "**/.worktrees/**",
    ],
    coverage: {
      provider: "v8",
      // Every source file, tested or not; tests, mocks and start-up apart
      include: ["src/**/*.{ts,tsx}"],
      // lcov for SonarCloud, beside the reports of Vitest by default
      reporter: ["text", "html", "clover", "json", "lcov"],
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "src/setupTests.ts",
        "src/index.tsx",
        "src/reportWebVitals.ts",
        "src/shared/tests/**",
      ],
      // Just under the measure of 2026-10-23 (82.89 / 68.1 / 76.86 / 83.33).
      // Raise them, never lower them (T-17).
      thresholds: {
        statements: 81,
        branches: 66,
        functions: 75,
        lines: 81,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      react: path.resolve(import.meta.dirname, "./node_modules/react"),
      "react-dom": path.resolve(
        import.meta.dirname,
        "./node_modules/react-dom",
      ),
    },
  },
});
