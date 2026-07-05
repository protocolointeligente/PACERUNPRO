import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/lib/**/*.ts", "src/lib/**/*.tsx"],
      exclude: [
        // Framework/infra — not unit testable without full env
        "src/lib/prisma.ts",
        "src/lib/mock-data.ts",
        "src/lib/email.ts",
        "src/lib/pagbank.ts",
        "src/lib/geo.ts",
        "src/lib/lazy.tsx",
        "src/lib/auth-guard.ts",
        // Service layer — depends on Prisma, covered by integration/E2E tests
        "src/lib/prescription-service.ts",
        // Types-only file — no runtime statements to cover
        "src/lib/types.ts",
        // Integration adapters — require HTTP mocking, covered by E2E
        "src/lib/integrations/**",
        "src/lib/load-persistence-service.ts",
        // Test files themselves
        "src/lib/**/__tests__/**",
        "src/lib/**/*.test.ts",
        "src/lib/**/*.test.tsx",
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
