// Builds the whole static site, as the deploy (.github/workflows/pages.yml) serves it: the app in <out>/profily/, the root
// pages and the redirects of the old addresses beside it (docs/code-health-plan.md, step 20).
//   node tools/build_site.mjs <out> [--from <dir>]
// What the deploy builds from the network first (steps of pages.yml: the paid-parking zones, the built-up area tiles, Prague's
// open data, Brno's parking, Plzeň's zones, Boston's maps, the OSM files of the fallback) it leaves in the folder --from
// (default: the current one), under these names; only site-zps.json is required, the rest the site goes without:
//   site-zps.json            the paid-parking zones (tools/build_zps.mjs)
//   site-osm/                the packed OSM files of the states on Pages and their index.json (the fallback when R2 is silent)
//   site-built-up-age/       tiles of the age of the built-up area (tools/build_built_up_age.mjs)
//   site-us-plan/            the surface maps of Boston and Cambridge (tools/build_planimetrics_us.mjs)
//   site-<city>/data/        the city's own data under data/<city>/ (praha, brno, plzen)
// The secrets come in the environment, none is needed (an empty one leaves the page with the fallback and a warning):
//   MAPY_KEY   the Mapy.com key for the street panorama
//   LOG_URL    the Worker keeping the log of cuts (its origin also goes into the CSP, connect-src)
//   DK_TOKEN   the Dataforsyningen token (Denmark's orthophoto and address search; public in the page by design)
// The output folder is made new (an existing one is emptied first).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeCitySites } from "./city_site.mjs";
import { versionSite } from "./version_modules.mjs";
import { writeRootSite } from "./build_root_site.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const warn = (msg) => console.log(`::warning::${msg}`);

// A JSON string put in place of NAME = "" in config.js (any characters are safe; replace with a function: no $& in the value).
function setConfig(file, name, value) {
  const text = fs.readFileSync(file, "utf8");
  const empty = `${name} = ""`;
  if (value) fs.writeFileSync(file, text.replace(empty, () => `${name} = ${JSON.stringify(value)}`));
  return fs.readFileSync(file, "utf8").includes(empty);
}

export function buildSite(out, from = ".", env = process.env) {
  const own = (p) => path.join(from, p);
  const has = (p) => fs.existsSync(own(p));
  if (!has("site-zps.json")) throw new Error(`${own("site-zps.json")}: the paid-parking zones are missing (node tools/build_zps.mjs)`);
  fs.rmSync(out, { recursive: true, force: true });
  const app = path.join(out, "profily"), data = path.join(app, "data");
  fs.mkdirSync(data, { recursive: true });
  // The local file with the keys (git-ignored) never goes on the web.
  fs.cpSync(path.join(ROOT, "app/public"), app, { recursive: true, filter: (f) => path.basename(f) !== "config.local.js" });

  const config = path.join(app, "config.js");
  const html = path.join(app, "index.html");
  const text = fs.readFileSync(config, "utf8");
  if (!text.includes("export const STATIC = false;")) throw new Error("config.js: STATIC = false not found");
  fs.writeFileSync(config, text.replace("export const STATIC = false;", "export const STATIC = true;"));
  if (setConfig(config, "MAPY_KEY", env.MAPY_KEY || "")) warn("no Mapy.com key (secret MAPY_KEY), the panorama falls back to a link");
  // The log of cuts: the Worker's address into config.js, its origin into the page's CSP (connect-src).
  const logUrl = env.LOG_URL || "";
  if (logUrl) fs.writeFileSync(html, fs.readFileSync(html, "utf8").replace(/(connect-src [^;]*)/, (all, a) => `${a} ${new URL(logUrl).origin}`));
  if (setConfig(config, "LOG_URL", logUrl)) warn("no log of cuts (repository variable LOG_URL)");
  // Denmark's Dataforsyningen token (keys.js), as the Mapy.com key.
  if (setConfig(config, "DK_TOKEN", env.DK_TOKEN || "")) warn("no Dataforsyningen token (repository variable DK_TOKEN), Denmark falls back to the estimate from OSM and Photon");

  // The packed OSM tiles also on Pages: where R2 does not answer, the app reads them here (gis.js).
  // Austria's file only on R2 (Bára 16. 11. 2026): with it the site would pass Pages' 1 GB.
  const packs = has("site-osm") ? fs.readdirSync(own("site-osm")).filter((f) => f.endsWith(".posm")) : [];
  if (has("site-osm/index.json") && packs.length) {
    fs.mkdirSync(path.join(data, "osm-pack"), { recursive: true });
    for (const f of [...packs, "index.json"]) fs.copyFileSync(own(`site-osm/${f}`), path.join(data, "osm-pack", f));
  }
  fs.copyFileSync(own("site-zps.json"), path.join(data, "zps.json"));
  if (has("site-built-up-age")) fs.cpSync(own("site-built-up-age"), path.join(data, "built-up-age"), { recursive: true });
  else warn("no built-up area tiles, flat roofs judged by the house alone");
  if (has("site-us-plan")) fs.cpSync(own("site-us-plan"), path.join(data, "us-plan"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "LICENSES-AND-SOURCES.md"), path.join(data, "LICENSES-AND-SOURCES.md"));
  // the old address of the file (LICENCE-A-ZDROJE.md until 27. 11. 2026) keeps working: the same text
  fs.copyFileSync(path.join(ROOT, "LICENSES-AND-SOURCES.md"), path.join(data, "LICENCE-A-ZDROJE.md"));
  // One page for the whole Czech Republic: the cities' own data under data/<city>/ (Brno's parking, Plzeň's zones,
  // Prague's open data), the former city sites as pages sending to it (old links keep working).
  for (const id of ["brno", "plzen", "praha"]) {
    const dir = own(`site-${id}/data`);
    if (fs.existsSync(dir) && fs.readdirSync(dir).length) fs.cpSync(dir, path.join(data, id), { recursive: true });
  }
  console.log(`přesměrování: ${writeCitySites(app).join(", ")}`);
  fs.writeFileSync(path.join(data, "README.txt"), `data/osm-pack: dlaždice odvozené z OpenStreetMap (výřezy Geofabrik Česká republika a Slovensko; Rakousko jen na R2), jeden
soubor na stát (index.json, formát v app/public/osmpack.js); tytéž soubory jsou na data.streetspace.eu/osm.
© přispěvatelé OpenStreetMap, licence ODbL 1.0 (https://opendatacommons.org/licenses/odbl/).
Vytvořeno skripty tools/build_osm_data.sh a tools/pack_osm_tiles.mjs v repozitáři této aplikace.
`);
  // Versions of the modules (tools/version_modules.mjs): an import map in index.html gives every module ?v=<hash of its
  // content>, so a visitor never gets a mix of old and new modules after a deploy. Last, after config.js and the CSP
  // are final (the hash of the map goes into the CSP).
  const { count, hash } = versionSite(app);
  console.log(`verze modulů: ${count} souborů, import mapa ${hash}`);
  // The app at streetspace.eu/profily/ (Bára 16. 11. 2026); the root and old links send there (tools/build_root_site.mjs).
  writeRootSite(out);
  fs.writeFileSync(path.join(out, ".nojekyll"), "");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), i = args.indexOf("--from");
  const from = i >= 0 ? args.splice(i, 2)[1] : ".";
  if (!args[0] || (i >= 0 && !from)) throw new Error("použití: node tools/build_site.mjs <výstup> [--from <adresář vstupů>]");
  buildSite(args[0], from);
}
