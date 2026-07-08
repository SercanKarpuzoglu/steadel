import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // tsconfig uses jsx:preserve for Next.js; compile JSX here for tests.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    // Integration tests share one database; keep them sequential.
    fileParallelism: false,
  },
});
