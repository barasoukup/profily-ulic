// Syntax check (node --check) of every script of the app, the server and the tools, in all subfolders.
// Run: node tools/check_syntax.mjs   (npm run check)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["leaflet", "fonts", "node_modules"]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(path.join(dir, e.name), out); }
    else if (/\.m?js$/.test(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}

export function scriptFiles() {
  const files = walk(path.join(root, "pilot/public"));
  for (const d of ["pilot", "tools"]) {
    const dir = path.join(root, d);
    files.push(...(d === "pilot" ? fs.readdirSync(dir).filter((f) => /\.mjs$/.test(f)).map((f) => path.join(dir, f)) : walk(dir)));
  }
  return files.sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let bad = 0;
  const files = scriptFiles();
  for (const f of files) {
    // .js files are ES modules (package.json type: module); node --check reads them so.
    const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
    if (r.status !== 0) { bad++; process.stderr.write(r.stderr || `${f}: failed\n`); }
  }
  console.log(`${files.length} scripts checked, ${bad} with a syntax error`);
  process.exit(bad ? 1 : 0);
}
