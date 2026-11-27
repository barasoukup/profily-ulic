// The A/B of the foral cadastres (towns/spain-foral.js): each house of sample.json asked as the app asks it
// (towns/spain.js sources.podlaznost at the point 4 m inside the house), A = ?foral=0 (what the app knew before: only
// OSM, the Catastro is not asked there), B = ?foral=1. The facts merged into the house's info as app.js does, and the
// look the app draws (profile.js buildingStyle). Politely: one request a house, a pause of 1.5 s, the answers kept in
// data/answers.json (a second run asks nothing again).
// Also (agreement): up to 15 OSM buildings a Basque city with building:levels, asked the same way (data/<city>.geojsonl).
//   node evaluation/spain/foral-ab/run.mjs → results/rezy.json, results/osm-levels.json
import fs from "node:fs";
import { setCity } from "../../../app/public/city.js";
import { buildingStyle } from "../../../app/public/profile.js";
import { sources } from "../../../app/public/towns/spain.js";

setCity("spain");
const HERE = new URL("./", import.meta.url), CACHE = new URL("data/answers.json", HERE);
const answers = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function ask(lat, lon) {
  const key = `${lat},${lon}`;
  if (!(key in answers)) {
    globalThis.PROFILY_ES = { foral: "1" };
    try { answers[key] = await sources.podlaznost(lat, lon); } catch (err) { answers[key] = { error: err.message }; } finally { delete globalThis.PROFILY_ES; }
    fs.writeFileSync(CACHE, JSON.stringify(answers));
    await pause(1500);
  }
  return answers[key];
}
// app.js: the house's info from OSM (derive.js) and what the cadastre adds.
function merged(osm, p) {
  const info = { ...(osm || {}) };
  if (!p || p.error) return info;
  if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.cornice + p.roof, src: "ipr" });
  if (p.built) info.built = p.built;
  if (p.house) info.house = 1;
  if (p.office) info.office = 1;
  if (p.type && (!info.type || info.type === "yes")) info.type = p.type;
  return info;
}

const sample = JSON.parse(fs.readFileSync(new URL("sample.json", HERE), "utf8"));
const rows = [];
for (const r of sample) for (const h of r.houses) {
  const p = await ask(h.lat, h.lon);
  const a = merged(h.osm, null), b = merged(h.osm, p);
  rows.push({ id: `${r.id}-${h.side}`, town: r.town, street: r.street, lat: h.lat, lon: h.lon, cut: { lat: r.lat, lon: r.lon, bearing: r.bearing }, osmLevels: h.osm?.levels ?? null,
    osmStart: h.osm?.start ?? null, answer: p, a: { levels: a.levels ?? null, year: a.built ?? a.start ?? null, look: buildingStyle(a) }, b: { levels: b.levels ?? null, year: b.built ?? b.start ?? null, look: buildingStyle(b) } });
}
fs.writeFileSync(new URL("results/rezy.json", HERE), JSON.stringify(rows, null, 1));

// OSM buildings with building:levels (seeded), the point inside the outline nearest its centroid.
let seed = 20261128;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const inside = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const lev = [];
for (const city of ["bilbao", "donostia", "vitoria", "pamplona"]) {
  const all = fs.readFileSync(new URL(`data/${city}.geojsonl`, HERE), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l.replace(/^\x1e/, "")))
    .filter((f) => f.properties?.building && f.properties["building:levels"] && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"));
  const picked = new Set();
  while (picked.size < Math.min(15, all.length)) picked.add(Math.floor(rnd() * all.length));
  for (const i of picked) {
    const f = all[i], ring = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
    let [x, y] = ring.slice(0, -1).reduce(([sx, sy], [px, py], _, a) => [sx + px / a.length, sy + py / a.length], [0, 0]);
    if (!inside(ring, x, y)) [x, y] = [(ring[0][0] + ring[1][0] + ring[2][0]) / 3, (ring[0][1] + ring[1][1] + ring[2][1]) / 3];
    if (!inside(ring, x, y)) continue;
    const lat = +y.toFixed(7), lon = +x.toFixed(7), p = await ask(lat, lon);
    const osm = parseInt(f.properties["building:levels"], 10) + (parseInt(f.properties["roof:levels"], 10) || 0);
    lev.push({ town: city, lat, lon, building: f.properties.building, osmLevels: osm, osmStart: parseInt(String(f.properties.start_date || "").slice(0, 4), 10) || null, foral: p.total ?? null, built: p.built ?? null });
  }
}
fs.writeFileSync(new URL("results/osm-levels.json", HERE), JSON.stringify(lev, null, 1));
console.log("domů", rows.length, "OSM s podlažími", lev.length);
