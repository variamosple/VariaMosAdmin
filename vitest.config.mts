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
      "**/cypress/**",
      "**/.worktrees/**"
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
