import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    pool: "forks",
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
      "**/.worktrees/**"
    ],
    coverage: {
      provider: "v8",
      // Every source file, tested or not; tests, mocks and start-up apart
      include: ["src/**/*.{ts,tsx}"],
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
      "react": path.resolve(import.meta.dirname, "./node_modules/react"),
      "react-dom": path.resolve(import.meta.dirname, "./node_modules/react-dom"),
    },
  },
});
