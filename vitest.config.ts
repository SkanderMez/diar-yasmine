import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Vitest 4+: tsconfig "paths" (the `@/*` alias) resolved natively.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/*.test.ts", "lib/env.ts", "lib/prisma.ts"],
    },
  },
});
