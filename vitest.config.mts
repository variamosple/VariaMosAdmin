import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    pool: "forks",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.stryker-tmp/**",
      "**/strykerTmp/**",
      "**/tests/**",
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
