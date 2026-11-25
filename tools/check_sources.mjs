// Weekly check of the data sources (Bára 12. 11. 2026): in every city one cut at its example point (city.js example) and,
// for every map of surfaces, one on a street it has (check_sources_lib.mjs POINTS) ask the sources the way the published
// app does (STATIC = true, the same modules), plus one image of each base map. A surface is required only where a map is
// expected (towns/*.js SURFACE_MAPS). A failed source is asked once more; one that was only slow both times is a warning
// where the state's first-class checks passed. Prints a table (and writes it to the summary of the GitHub run) and ends with
// code 1 when a source failed or came back empty where it must have data, so the run fails and GitHub sends Bára its
// e-mail. About two hundred small requests a week, one city after another.
//   node tools/check_sources.mjs                 against the published site (its OSM tiles and data files)
//   SITE=http://localhost:5173/ node tools/check_sources.mjs   against the local server
//   node tools/check_sources.mjs praha brno wien    only these cities or maps
import { register } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { runChecks, settle, isBad, watched } from "./check_sources_lib.mjs";

// Intermediate certificates some towns' servers do not send (Frýdek-Místek sends an old one): browsers find
// them themselves, Node takes them from tools/ca at its start, so the script starts itself again with them.
if (!process.env.NODE_EXTRA_CA_CERTS) {
  const dir = new URL("ca/", import.meta.url);
  const pem = fs.readdirSync(dir).filter((f) => f.endsWith(".pem")).map((f) => fs.readFileSync(new URL(f, dir), "utf8")).join("\n");
  const file = new URL("../.ca-check.pem", dir);
  fs.writeFileSync(file, pem);
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: "inherit", env: { ...process.env, NODE_EXTRA_CA_CERTS: fileURLToPath(file) } });
  fs.rmSync(file, { force: true });
  process.exit(r.status ?? 1);
}

// The app's modules as published: config.js with STATIC = true (the deploy rewrites it the same way), whatever else it
// exports (LOG_URL, DK_TOKEN…) as the repository has it: empty.
register("data:text/javascript," + encodeURIComponent(`import fs from "node:fs";
export async function load(url, ctx, next) {
  if (!url.endsWith("/pilot/public/config.js")) return next(url, ctx);
  const source = fs.readFileSync(new URL(url), "utf8").replace(/export const STATIC = [^;]*;/, "export const STATIC = true;");
  return { format: "module", shortCircuit: true, source };
}`));

// The app's relative requests (OSM tiles, data/zps.json…) go to the site, as in the browser.
const SITE = process.env.SITE || "https://streetspace.eu/profily/";
const native = globalThis.fetch;
globalThis.fetch = watched(native, SITE);
console.warn = () => {}; // the sources' own notes on retries; the table says what came of them

await import("../pilot/public/america.js"); // North America's modules (late.js)
const cityModule = await import("../pilot/public/city.js");
const sources = await import("../pilot/public/sources.js");
const { TOWNS } = await import("../pilot/public/towns/index.js");
// The boundaries, as app.js loads them (a source asks in which town or state its box lies).
const json = (f) => { const u = new URL(`../pilot/public/${f}`, import.meta.url); return fs.existsSync(u) ? JSON.parse(fs.readFileSync(u, "utf8")) : null; };
cityModule.loadBounds(json("mesta.json"));
cityModule.loadStates({ ...json("staty.json"), ...json("staty-america.json") });
if (json("mesta-sk.json")) cityModule.loadSkTowns(json("mesta-sk.json"));
for (const f of fs.readdirSync(new URL("../pilot/public/", import.meta.url)).filter((f) => /^mesta-[a-z]{2}\.json$/.test(f))) cityModule.loadTowns(json(f));

const only = process.argv.slice(2);
const pause = process.env.CHECK_PAUSE ? Number(process.env.CHECK_PAUSE) : 15000; // ms before a failed check is asked again
const rows = only.length === 1 && only[0] === "podklad" ? [] : settle(await runChecks({ ...cityModule, sources, TOWNS }, { only, pause }));

// One image of each base map around Prague's centre (Mapa IPR, Ortofoto ČÚZK, Technická mapa ČÚZK, OSM).
async function image(name, url) {
  const t = Date.now();
  let state, note;
  for (let i = 0; i < 2; i++) {
    if (i) await new Promise((res) => setTimeout(res, pause));
    state = "ok"; note = "";
    try {
      const r = await native(url, { signal: AbortSignal.timeout(25000), headers: { "User-Agent": "profily-ulic weekly check (github.com/barasoukup/profily-ulic)" } });
      const type = r.headers.get("content-type") || "";
      if (!r.ok || !type.startsWith("image/")) { state = "CHYBA"; note = `HTTP ${r.status} ${type}`; }
    } catch (err) { state = "CHYBA"; note = err.message; }
    if (state === "ok") break;
  }
  rows.push({ city: "podklad", name, state, note, time: `${((Date.now() - t) / 1000).toFixed(1)} s` });
}
if (!only.length || only.includes("podklad")) {
  // Staroměstské náměstí: a tile of z 18 (17 for OSM) and a box of 256 m in Web Mercator.
  const [lon, lat] = [14.4213, 50.0875];
  const tile = (z) => { const n = 2 ** z, r = (lat * Math.PI) / 180; return [Math.floor(((lon + 180) / 360) * n), Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n)]; };
  const x = (lon * 20037508.34) / 180, y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 6378137;
  const box3857 = [x - 128, y - 128, x + 128, y + 128].map(Math.round).join(",");
  const wms = (url, layer) => `${url}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${layer}&STYLES=&CRS=EPSG:3857&BBOX=${box3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png`;
  const [tx, ty] = tile(18), [ox, oy] = tile(17);
  await image("Mapa IPR", `https://tiles.arcgis.com/tiles/SBTXIEUGWbqzUecw/arcgis/rest/services/MTVU_WGS84/MapServer/tile/18/${ty}/${tx}`);
  await image("Ortofoto ČÚZK (WMS)", wms("https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer", "0"));
  await image("Technická mapa ČÚZK (DMVS)", wms("https://dmvs.cuzk.gov.cz/api/wms/dtm_zps_plochy_bar", "dtm_zps_plochy_bar"));
  await image("OpenStreetMap", `https://tile.openstreetmap.org/17/${ox}/${oy}.png`);
}

const bad = rows.filter(isBad), warned = rows.filter((r) => r.state === "varování");
const table = ["| město | zdroj | stav | poznámka | čas |", "|---|---|---|---|---|", ...rows.map((r) => `| ${[r.city, r.name, r.state, r.note, r.time].join(" | ")} |`)].join("\n");
const head = (bad.length ? `**Některé zdroje nefungují** (${bad.length} z ${rows.length}).` : `Všechny zdroje odpovídají (${rows.length}).`) + (warned.length ? ` Varování: ${warned.length}.` : "");
console.log(`${head}\n\n${table}`);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Kontrola zdrojů dat\n\n${head}\n\n${table}\n`);
process.exit(bad.length ? 1 : 0);
