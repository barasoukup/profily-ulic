// Weekly check of the data sources (Bára 12. 11. 2026): in every city one cut at its example point (city.js
// example) asks the sources the way the published app does (STATIC = true, the same modules), plus one
// image of each base map. Prints a table (and writes it to the summary of the GitHub run) and ends with
// code 1 when a source failed or came back empty where the city centre must have data, so the run fails
// and GitHub sends Bára its e-mail. About a hundred small requests a week, one city after another.
//   node tools/check_sources.mjs                 against the published site (its OSM tiles and data files)
//   SITE=http://localhost:5173/ node tools/check_sources.mjs   against the local server
//   node tools/check_sources.mjs praha brno      only these cities
import { register } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";

// Intermediate certificates some towns' servers do not send (Frýdek-Místek sends an old one): browsers find
// them themselves, Node takes them from tools/ca at its start, so the script starts itself again with them.
if (!process.env.NODE_EXTRA_CA_CERTS) {
  const dir = new URL("ca/", import.meta.url);
  const pem = fs.readdirSync(dir).filter((f) => f.endsWith(".pem")).map((f) => fs.readFileSync(new URL(f, dir), "utf8")).join("\n");
  const file = new URL("../.ca-check.pem", dir);
  fs.writeFileSync(file, pem);
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: "inherit", env: { ...process.env, NODE_EXTRA_CA_CERTS: file.pathname } });
  fs.rmSync(file, { force: true });
  process.exit(r.status ?? 1);
}

// The app's modules as published: config.js with STATIC = true (the deploy rewrites it the same way).
register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) {
  if (url.endsWith("/pilot/public/config.js")) return { format: "module", shortCircuit: true,
    source: "export const STATIC = true; export const MAPY_KEY = ''; export const LOG_URL = '';" };
  return next(url, ctx);
}`));

// The app's relative requests (OSM tiles, data/zps.json…) go to the site, as in the browser.
const SITE = process.env.SITE || "https://barasoukup.github.io/profily-ulic/";
const native = globalThis.fetch;
// Every request is watched: the sources often leave a failed layer out (a town's lines, the points of
// Prague's technical map) and the profile is then built without it, so a quiet failure counts as one.
let trouble = [];
const host = (url) => new URL(String(url)).hostname;
// A server that sends no intermediate certificate: browsers fetch it themselves, Node does not.
const CHAIN = new Set(["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"]);
globalThis.fetch = async (url, opts) => {
  url = /^https?:/.test(String(url)) ? url : new URL(String(url), SITE);
  try {
    const r = await native(url, opts);
    if (!r.ok) trouble.push(`${host(url)} HTTP ${r.status}`);
    else if ((r.headers.get("content-type") || "").includes("json")) {
      const text = await r.clone().text();
      const m = text.slice(0, 400).match(/"error"\s*:\s*\{[^}]*"code"\s*:\s*(\d+)/);
      if (m) trouble.push(`${host(url)} chyba ArcGIS ${m[1]}`);
    }
    return r;
  } catch (err) {
    const code = err.cause?.code || err.cause?.message || err.message;
    trouble.push(CHAIN.has(code) ? `${host(url)} neposílá celý řetězec certifikátů (prohlížeče si poradí)` : `${host(url)} ${code}`);
    throw err;
  }
};
console.warn = () => {}; // the sources' own notes on retries; the table says what came of them

const { CITY_IDS, cityById, setCity } = await import("../pilot/public/city.js");
const sources = await import("../pilot/public/sources.js");
const { TOWNS } = await import("../pilot/public/towns/index.js");

const count = (json) => json?.features?.length ?? json?.elements?.length ?? 0;
const rows = [];
let failed = false;
// One source: "ok" with the number of features, "prázdné", "náhrada ČÚZK", "tichá chyba" (a request failed
// but the source went on without it), "varování" (only a server's incomplete certificate chain) or "CHYBA".
// need: empty is a failure (the centre of a city has surfaces and OSM).
async function check(city, name, run, need = false) {
  const failedBefore = failed;
  const t = Date.now();
  let state, note = "";
  trouble = [];
  try {
    const json = await run();
    const n = count(json);
    if (json?.dmvs) { state = "náhrada ČÚZK"; note = `${n} prvků z technické mapy ČÚZK, vlastní služba nic nevrátila`; failed ||= need; }
    else if (n || (json && !json.features && !json.elements)) { state = "ok"; note = n ? `${n} prvků` : ""; }
    else if (need) { state = "CHYBA"; note = "prázdná odpověď"; failed = true; }
    else state = "prázdné";
  } catch (err) {
    state = "CHYBA"; note = String(err.message || err).replace(/\s+/g, " ").slice(0, 120); failed = true;
  }
  if (trouble.length) {
    const what = [...new Set(trouble)].join("; ");
    // Only a missing certificate chain: the app works in browsers, the town should still hear of it.
    const chainOnly = trouble.every((x) => x.includes("certifikátů"));
    if (state === "CHYBA" && chainOnly) { state = "varování"; failed = failedBefore; }
    else if (state !== "CHYBA") { state = chainOnly ? "varování" : "tichá chyba"; failed ||= !chainOnly; }
    note = [note, what].filter(Boolean).join(" – ");
  }
  rows.push([city, name, state, note, `${((Date.now() - t) / 1000).toFixed(1)} s`]);
}

const only = process.argv.slice(2);
// Towns that only borrow the national sources (olomouc… = cesko) are checked once, as "cesko".
const seen = new Set();
for (const id of CITY_IDS) {
  if (only.length && !only.includes(id)) continue;
  const mod = TOWNS[id];
  if (mod && seen.has(mod)) continue;
  if (mod) seen.add(mod);
  const c = cityById(id);
  const [lat, lon] = c.example.split(",").map(Number);
  setCity(id);
  const d = 0.0006; // about 60 m around the point, as a short cut
  const bbox = [lon - d, lat - d, lon + d, lat + d].map((x) => x.toFixed(6)).join(",");
  await check(id, "OSM (dlaždice webu)", () => sources.osm(lat, lon, 80), true);
  await check(id, "plochy (MTVU / pasport)", () => sources.mtvu(bbox), true);
  await check(id, "linie a body (koleje, ploty…)", () => sources.linie(bbox));
  if (id === "praha") await check(id, "zóny placeného stání (soubor webu)", () => sources.zpsZones().then((b) => (b ? { features: b } : null)), true);
  const inZone = await sources.zps(lat, lon).catch(() => undefined);
  await check(id, "parkování", () => sources.parkovani(bbox, inZone));
  await check(id, "budovy (podlaží)", () => sources.podlaznost(lat, lon));
}

// One image of each base map around Prague's centre (Mapa IPR, Ortofoto ČÚZK, Technická mapa ČÚZK, OSM).
async function image(name, url) {
  const t = Date.now();
  let state = "ok", note = "";
  try {
    const r = await native(url, { signal: AbortSignal.timeout(25000), headers: { "User-Agent": "profily-ulic weekly check (github.com/barasoukup/profily-ulic)" } });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.startsWith("image/")) { state = "CHYBA"; note = `HTTP ${r.status} ${type}`; failed = true; }
  } catch (err) { state = "CHYBA"; note = err.message; failed = true; }
  rows.push(["podklad", name, state, note, `${((Date.now() - t) / 1000).toFixed(1)} s`]);
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

const table = ["| město | zdroj | stav | poznámka | čas |", "|---|---|---|---|---|", ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
const bad = rows.filter((r) => !["ok", "prázdné", "varování"].includes(r[2]));
const head = failed ? `**Některé zdroje nefungují** (${bad.length} z ${rows.length}).` : `Všechny zdroje odpovídají (${rows.length}).`;
console.log(`${head}\n\n${table}`);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Kontrola zdrojů dat\n\n${head}\n\n${table}\n`);
process.exit(failed ? 1 : 0);
