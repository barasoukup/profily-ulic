// Versions the ES modules of a built site (the app's folder, e.g. _site before it is moved to profily/), so that a visitor
// never gets a mix of old and new modules after a deploy (docs/code-health-plan.md, step 10). No bundler: every module
// `*.js` / `*.mjs` of the site gets `?v=<first 10 hex of the SHA-256 of its content>` through an import map written
// into index.html, and the entry `<script type="module" src>` (a script's src does not go through the map) gets the
// version itself. Static `import "./x.js"` and dynamic `import()` of the modules resolve to a URL that is a key of
// the map, so they go through it; the sources stay as they are, only the output is changed. The map is an inline
// script, so its SHA-256 is added to the page's CSP (script-src), never 'unsafe-inline'.
//   node tools/version_modules.mjs _site
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// Classic scripts (not modules): errors.js, Leaflet.
const SKIP = (rel) => rel === "errors.js" || rel.startsWith("leaflet/");

export function moduleFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.m?js$/.test(e.name)) {
        const rel = path.relative(dir, p).split(path.sep).join("/");
        if (!SKIP(rel)) out.push(rel);
      }
    }
  };
  walk(dir);
  return out.sort();
}

export const versionOf = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 10);

export function versionSite(dir) {
  const imports = {};
  for (const rel of moduleFiles(dir)) imports[`./${rel}`] = `./${rel}?v=${versionOf(path.join(dir, rel))}`;
  const json = JSON.stringify({ imports }, null, 1);
  const hash = "sha256-" + crypto.createHash("sha256").update(`\n${json}\n`).digest("base64");
  const htmlFile = path.join(dir, "index.html");
  let html = fs.readFileSync(htmlFile, "utf8");
  // The entry modules of the page.
  let entries = 0;
  html = html.replace(/(<script\s+type="module"\s+src=")([^"?]+)(")/g, (all, a, src, b) => {
    const v = imports[`./${src.replace(/^\.\//, "")}`];
    if (!v) throw new Error(`index.html: the module ${src} is not in the site`);
    entries++;
    return `${a}${v.slice(2)}${b}`;
  });
  if (!entries) throw new Error("index.html has no <script type=\"module\" src>");
  // The map goes before the first module script.
  const at = html.search(/<script\s+type="module"/);
  html = html.slice(0, at) + `<script type="importmap">\n${json}\n</script>\n  ` + html.slice(at);
  // …and its hash into the CSP of the page.
  const csp = /(<meta http-equiv="Content-Security-Policy" content="[^"]*?script-src )([^;"]*)/;
  if (!csp.test(html)) throw new Error("index.html: no script-src in the CSP");
  html = html.replace(csp, (all, a, b) => `${a}${b} '${hash}'`);
  fs.writeFileSync(htmlFile, html);
  return { count: Object.keys(imports).length, hash };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) throw new Error("použití: node tools/version_modules.mjs <adresář webu>");
  const { count, hash } = versionSite(dir);
  console.log(`verze modulů: ${count} souborů, import mapa ${hash}`);
}
