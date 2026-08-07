import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.stryker-tmp/**",
      "**/strykerTmp/**",
      "**/cypress/**"
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
