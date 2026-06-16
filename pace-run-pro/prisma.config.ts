import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // URL sem pooler: usada pelo CLI (prisma db push / migrate) para DDL.
    // No Vercel, configure ambas as variáveis de ambiente.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
