import { defineConfig } from "prisma/config";
import { readFileSync } from "fs";
import { resolve } from "path";

// Prisma 7 CLI does not auto-load .env before evaluating prisma.config.ts.
// We parse .env files manually using only Node built-ins so no extra deps needed.
function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // file not found — skip silently
  }
}

const root = process.cwd();
loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

export default defineConfig({
  datasource: {
    // CLI uses the direct (non-pooler) URL for DDL operations.
    // Runtime uses DATABASE_URL (pooler) via the PrismaClient constructor.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
