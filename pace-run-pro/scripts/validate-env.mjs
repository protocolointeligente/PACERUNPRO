import { existsSync, readFileSync } from "node:fs";

const envPath = ".env.local";
const required = ["DATABASE_URL", "NEXTAUTH_SECRET"];
const recommended = ["NEXT_PUBLIC_APP_URL", "PAGBANK_ENV", "PAGBANK_TOKEN", "PAGBANK_WEBHOOK_TOKEN"];

if (!existsSync(envPath)) {
  console.error("[env] .env.local não encontrado. Copie .env.example para .env.local.");
  process.exit(1);
}

const text = readFileSync(envPath, "utf8");
const values = new Map(text.split(/\r?\n/).filter((line) => /^[A-Z_][A-Z0-9_]*=/.test(line)).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim()];
}));
const missing = required.filter((key) => !values.get(key));
const absentRecommended = recommended.filter((key) => !values.get(key));

if (missing.length) {
  console.error(`[env] obrigatórias ausentes: ${missing.join(", ")}`);
  process.exit(1);
}
if (absentRecommended.length) console.warn(`[env] recomendadas ausentes: ${absentRecommended.join(", ")}`);
console.log(`[env] válido para ${process.env.NODE_ENV ?? "development"}`);
