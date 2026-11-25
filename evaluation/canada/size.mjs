// What a visitor's start loads (gzip): the static module graph of app.js, a language's texts, the page and the JSON files app.js
// fetches at its start.   node evaluation/canada/size.mjs <pilot/public> [<another>]
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
const size = (root) => {
  const seen = new Set(), gz = (f) => { try { return gzipSync(fs.readFileSync(f), { level: 9 }).length; } catch { return 0; } };
  const walk = (f) => {
    if (seen.has(f) || !fs.existsSync(f)) return;
    seen.add(f);
    for (const m of fs.readFileSync(f, "utf8").matchAll(/^\s*(?:import|export)\b[^;'"]*?["'](\.[^"']+\.js)["']/gm)) walk(path.join(path.dirname(f), m[1]));
  };
  walk(path.join(root, "app.js"));
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8"), start = app.slice(0, app.indexOf("// The city of a point becomes the current one"));
  const json = [...new Set([...start.matchAll(/["']([\w-]+\.json)["']/g)].map((m) => m[1]))];
  const out = { js: [...seen].reduce((s, f) => s + gz(f), 0), json: json.reduce((s, f) => s + gz(path.join(root, f)), 0), "index.html + style.css": gz(path.join(root, "index.html")) + gz(path.join(root, "style.css")) };
  for (const l of ["en", "de", "hu"]) out[`${l}.js`] = gz(path.join(root, `${l}.js`));
  return { ...out, files: json.join(" "), modules: seen.size };
};
for (const root of process.argv.slice(2)) console.log(root, size(path.resolve(root)));
