/**
 * Configuration file for Vitest testing framework in a TypeScript + React project.
 */

import { defineConfig } from "vitest/config"; // Imports Vitest's `defineConfig` function to configure test settings

export default defineConfig({
  plugins: [],
  test: {
    environment: "jsdom", // Ensure the jsdom environment is used (it acts like lightweight virtual browser, necessary for running tests)
    globals: true, // Enabling global variables like describe, it, expect, etc.
    setupFiles: "config/setup.ts", // Setup file for tests
    coverage: {
      exclude: ["src/main.tsx", "config/", "dist/", "src/types/*"],
      reporter: ["text", "json-summary", "json"],
      reportsDirectory: "./coverage",
    },
  },
});
