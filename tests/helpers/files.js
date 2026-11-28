// Where the tests find the app's files (shared by the guard tests and the state tests).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LANGS } from "../../app/public/i18n.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const PUB = path.join(ROOT, "app/public");
export const PUBLIC = new URL("../../app/public/", import.meta.url);

export const publicUrl = (f) => new URL(f, PUBLIC);
export const readText = (f) => fs.readFileSync(publicUrl(f), "utf8");
export const readJson = (f) => JSON.parse(readText(f));
export const exists = (f) => fs.existsSync(publicUrl(f));

// The scripts of app/public (relative to it): the top ones and those of the folders asked for; with `noLangs` without the
// languages' texts (en.js, sk.js … only data, they link to the sources in the footer).
export function moduleFiles({ dirs = ["towns", "countries"], noLangs = false } = {}) {
  const files = [...fs.readdirSync(PUBLIC).filter((f) => f.endsWith(".js")), ...dirs.flatMap((d) => fs.readdirSync(publicUrl(`${d}/`)).map((f) => `${d}/${f}`))]
    .filter((f) => f.endsWith(".js"));
  return noLangs ? files.filter((f) => !Object.keys(LANGS).some((l) => f === `${l}.js`)) : files;
}

// Every .js / .mjs under `dir` (an absolute path), without the folders of other people's code and data.
export function walkScripts(dir, skip = ["leaflet", "fonts", "node_modules", "ort", "data", "vendor", ".git", ".wrangler"], out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!skip.includes(e.name) && !e.name.startsWith(".")) walkScripts(path.join(dir, e.name), skip, out); }
    else if (/\.m?js$/.test(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}
