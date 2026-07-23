import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const schemaPath = path.join(root, "prisma", "schema.prisma");
const apiRoot = path.join(root, "src", "app", "api");
const schema = fs.readFileSync(schemaPath, "utf8");
const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((match) => match[1]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith(".ts") ? [file] : [];
  });
}

const routes = walk(apiRoot).map((file) => fs.readFileSync(file, "utf8")).join("\n");
const unused = models.filter((model) => !new RegExp(`prisma\\.${model.charAt(0).toLowerCase()}${model.slice(1)}\\b`).test(routes));
const indexDeclarations = (schema.match(/@@index\(/g) ?? []).length;

console.log(`Prisma models: ${models.length}`);
console.log(`API route files scanned: ${walk(apiRoot).length}`);
console.log(`@@index declarations in schema: ${indexDeclarations}`);
console.log(`Models without direct API prisma usage: ${unused.length}`);
for (const model of unused) console.log(`- ${model}`);

