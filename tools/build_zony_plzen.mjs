// Paid parking zones of Plzeň for the profile, from the city's open data (opendata.plzen.eu, dataset 125
// „Parkovací zóny“, CC0): lines along the street axes with the zone's name (Zóna A … G, Petrohrad,
// Přednádraží, Roudná) or „Vyhrazené stání“. The city publishes them only as a zip (GeoJSON in WGS 84,
// within about 1 m of the OSM axes), so the file is fetched once per deploy and cut down here (Bára).
// towns/plzen.js turns the lines into parking strips along the curbs of the roadway.
//   node tools/build_zony_plzen.mjs [out dir]   (default pilot/data/plzen)
//   → zony.json  {"date": "2026-10-06", "lines": [[name, [[lon, lat], …]], …]}
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ZIP = "https://opendata.plzen.eu/public/opendata/download-file/355"; // parkovacizony_GEOJSON.zip
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const outDir = process.argv[2] || path.join(ROOT, "pilot", "data", "plzen");

const r = await fetch(ZIP, { signal: AbortSignal.timeout(120000) });
if (!r.ok) throw new Error(`${ZIP}: ${r.status}`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zony-"));
const zip = path.join(tmp, "zony.zip");
fs.writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
// The zip holds one GeoJSON; its date in the listing is the date of the data.
const listing = execFileSync("unzip", ["-l", zip], { encoding: "utf8" });
const entry = listing.split("\n").map((l) => l.trim().split(/\s+/)).find((p) => /\.geojson$/i.test(p.at(-1) || ""));
if (!entry) throw new Error("zip zón bez GeoJSON");
const [, day, , name] = entry;
const [a, b, c] = day.split("-"); // MM-DD-YYYY (Info-ZIP) or YYYY-MM-DD
const date = c?.length === 4 ? `${c}-${a}-${b}` : day;
const geo = JSON.parse(execFileSync("unzip", ["-p", zip, name], { encoding: "utf8", maxBuffer: 64 << 20 }));
fs.rmSync(tmp, { recursive: true, force: true });

// WGS 84 is expected: a CRS other than CRS84/4326 (S-JTSK) would need a transformation first.
const crs = geo.crs?.properties?.name || "";
if (crs && !/CRS84|4326/.test(crs)) throw new Error(`zóny: neočekávaný souřadnicový systém ${crs}`);
const round = (v) => +v.toFixed(6);
const lines = [];
for (const f of geo.features || []) {
  const g = f.geometry;
  const paths = g?.type === "LineString" ? [g.coordinates] : g?.type === "MultiLineString" ? g.coordinates : [];
  for (const p of paths) {
    if (p.length < 2 || !p.every(([x, y]) => x > 12 && x < 19 && y > 48 && y < 51.1)) continue;
    lines.push([String(f.properties?.NAZEV || "Parkovací zóna").trim(), p.map(([x, y]) => [round(x), round(y)])]);
  }
}
if (lines.length < 100) throw new Error(`zóny: málo dat (${lines.length} linií)`);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "zony.json"), JSON.stringify({ date, lines }));
console.log(`zóny Plzeň: ${lines.length} linií z ${date} → ${path.join(outDir, "zony.json")}`);
