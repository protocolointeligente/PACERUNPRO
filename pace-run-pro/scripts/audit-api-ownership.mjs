import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(process.cwd(), "src", "app", "api");
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (entry === "route.ts") files.push(path);
  }
}
walk(root);
const scoped = files.filter((file) => /[\\/](coach|athlete|atleta)[\\/]/.test(file));
const findings = scoped.flatMap((file) => {
  const source = readFileSync(file, "utf8");
  const issues = [];
  if (source.includes("legacyAthleteApi")) return [];
  if (!source.includes("getSession")) issues.push("sem getSession");
  if (/coach[\\/]route\.ts$/.test(file) && !source.includes('"COACH"')) issues.push("sem role COACH");
  if (/[\\/](athlete|atleta)[\\/]/.test(file) && !source.includes("session")) issues.push("sem uso de sessão");
  return issues.map((issue) => `${relative(process.cwd(), file)}: ${issue}`);
});
if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Ownership audit OK: ${scoped.length} rotas escopadas verificadas.`);
}
