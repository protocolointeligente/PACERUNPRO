// prisma.config.ts
// Deliberately does NOT import from "prisma/config" — that subpath cannot be
// resolved by the Prisma CLI's isolated module loader on some environments.
// defineConfig() is a pure type-helper (identity function) so we skip it.
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

function loadEnvFile(filePath: string): void {
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

// Load env files relative to this config file, not process.cwd().
// On Vercel / CI the vars are already in process.env so the files don't matter.
const root = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const prismaConfig = {
  datasource: {
    url:
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.POSTGRES_PRISMA_URL ??
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.POSTGRES_URL ??
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
};

export default prismaConfig;
