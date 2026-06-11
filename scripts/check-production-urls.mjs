import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", "node_modules", ".npm-cache"]);
const blocked = ["local" + "host", "127." + "0.0.1", "::" + "1"];
const matches = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (!/\.(ts|tsx|js|mjs|json|md|css|prisma|example)$/i.test(entry.name)) continue;
    const content = await readFile(fullPath, "utf8");
    for (const token of blocked) {
      if (content.includes(token)) {
        matches.push(`${path.relative(root, fullPath)} contains a blocked local development URL token`);
      }
    }
  }
}

await walk(root);

if (matches.length > 0) {
  console.error(matches.join("\n"));
  process.exit(1);
}

console.log("No blocked local development URLs found.");
