// The A/B of Finland's buildings (towns/finland.js): each house of sample.json asked as the app asks it (the point 4 m
// inside the OSM building at the facade): A = only OSM (?hkibuild=0&ryhti=0), B = Helsinki's register in Helsinki, else
// Ryhti (the point inside the OSM outline), and in Helsinki also Ryhti alone (C, ?hkibuild=0) for the agreement of the two.
// The facts merged as app.js does, the look the app draws (profile.js buildingStyle, the country's look). Politely: one
// request a house and source, a pause of 1.5 s, the answers kept in data/answers.json (a second run asks nothing again).
// Also (agreement): up to 10 OSM buildings a city with building:levels, asked the same way.
//   node evaluation/finland/buildings-ab/run.mjs → vysledky/rezy.json, vysledky/osm-levels.json
import fs from "node:fs";
import { setCity } from "../../../pilot/public/city.js";
import { buildingStyle } from "../../../pilot/public/profile.js";
import { ask, hkiBuildingUrl, hkiPick, ryhtiAt, AREAS } from "../../../pilot/public/towns/finland.js";
import { inArea } from "../../../pilot/public/places.js";

setCity("finland");
const HERE = new URL("./", import.meta.url), CACHE = new URL("data/answers.json", HERE);
const OSM = new URL("../../../../../../data/osm/fi/fi_buildings.geojsonl", import.meta.url);
fs.mkdirSync(new URL("data/", HERE), { recursive: true });
const answers = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function cached(key, fn) {
  if (!(key in answers)) {
    try { answers[key] = await fn(); } catch (err) { answers[key] = { error: err.message }; }
    fs.writeFileSync(CACHE, JSON.stringify(answers));
    await pause(1500);
  }
  return answers[key];
}
const hki = (lat, lon) => cached(`hki ${lat},${lon}`, async () => hkiPick(await ask(hkiBuildingUrl(lat, lon)), lat, lon));
const ryhti = (lat, lon, outline) => cached(`ryhti ${lat},${lon}`, () => ryhtiAt(lat, lon, outline));
// app.js: the house's info from OSM (derive.js) and what the register adds (ruianFacts).
function merged(osm, p) {
  const info = { ...(osm || {}) };
  if (!p || p.error) return info;
  if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.cornice + p.roof, src: "ipr" });
  for (const k of ["built", "solid", "house", "office"]) if (p[k]) info[k] = k === "built" ? p.built : 1;
  if (p.material && !info.material) info.material = p.material;
  if (p.type && (!info.type || info.type === "yes")) info.type = p.type;
  return info;
}
const sample = JSON.parse(fs.readFileSync(new URL("sample.json", HERE), "utf8"));
const rows = [];
for (const r of sample) for (const h of r.houses) {
  const inHki = inArea(AREAS.helsinki, h.lon, h.lat);
  const c = await ryhti(h.lat, h.lon, h.outline);
  const own = inHki ? await hki(h.lat, h.lon) : null;
  const p = own?.fiBuild ? own : c;
  const info = { ...h.osm, at: [h.lon, h.lat] };
  const a = merged(info, null), b = merged(info, p);
  rows.push({ id: `${r.id}-${h.side}`, town: r.town, street: r.street, lat: h.lat, lon: h.lon, cut: { lat: r.lat, lon: r.lon, bearing: r.bearing }, osmLevels: h.osm?.levels ?? null,
    osmStart: h.osm?.start ?? null, source: p?.fiBuild ?? null, answer: p, ryhti: inHki ? c : undefined,
    a: { levels: a.levels ?? null, year: a.built ?? a.start ?? null, look: buildingStyle(a) }, b: { levels: b.levels ?? null, year: b.built ?? b.start ?? null, material: b.material ?? null, look: buildingStyle(b) } });
}
fs.writeFileSync(new URL("vysledky/rezy.json", HERE), JSON.stringify(rows, null, 1));

// OSM buildings with building:levels (seeded) in the four centres, the point inside the outline near its centroid.
let seed = 20261129;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const inside = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const CENTRES = { helsinki: [60.1699, 24.9384], tampere: [61.4981, 23.7610], turku: [60.4518, 22.2666], oulu: [65.0121, 25.4651] };
const all = fs.readFileSync(OSM, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l.replace(/^\x1e/, "")))
  .filter((f) => /"building:levels"=>/.test(f.properties?.other_tags || "") && /Polygon$/.test(f.geometry.type))
  .map((f) => (f.geometry.type === "MultiPolygon" ? { ...f, geometry: { type: "Polygon", coordinates: f.geometry.coordinates[0] } } : f));
const tag = (f, k) => new RegExp(`"${k}"=>"([^"]*)"`).exec(f.properties.other_tags || "")?.[1];
const lev = [];
for (const [city, [lat0, lon0]] of Object.entries(CENTRES)) {
  const near = all.filter((f) => { const c = f.geometry.coordinates[0][0]; return Math.abs(c[0] - lon0) < 0.02 && Math.abs(c[1] - lat0) < 0.01; });
  const picked = new Set();
  while (picked.size < Math.min(10, near.length)) picked.add(Math.floor(rnd() * near.length));
  for (const i of picked) {
    const f = near[i], ring = f.geometry.coordinates[0];
    let [x, y] = ring.slice(0, -1).reduce(([sx, sy], [px, py], _, a) => [sx + px / a.length, sy + py / a.length], [0, 0]);
    if (!inside(ring, x, y)) [x, y] = [(ring[0][0] + ring[1][0] + ring[2][0]) / 3, (ring[0][1] + ring[1][1] + ring[2][1]) / 3];
    if (!inside(ring, x, y)) continue;
    const lat = +y.toFixed(7), lon = +x.toFixed(7);
    const p = inArea(AREAS.helsinki, lon, lat) ? await hki(lat, lon) : await ryhti(lat, lon, f.geometry.coordinates);
    const osm = parseInt(tag(f, "building:levels"), 10) + (parseInt(tag(f, "roof:levels"), 10) || 0);
    lev.push({ town: city, lat, lon, building: f.properties.building, osmLevels: osm, source: p.fiBuild ?? null, total: p.total ?? null, built: p.built ?? null });
  }
}
fs.writeFileSync(new URL("vysledky/osm-levels.json", HERE), JSON.stringify(lev, null, 1));
console.log("domů", rows.length, "OSM s podlažími", lev.length);
