// The A/B of Denmark's buildings (towns/denmark.js; Bára 23. 11. 2026): in the centres of Copenhagen and Aarhus 30 OSM
// buildings each (seeded), 15 with building:levels and 15 without, the point inside the outline asked as the app asks a
// facade (Copenhagen's k101:bygning, Aarhus's BBR buildings). A = OSM only (levels, start_date), B = the town's buildings.
// Compares the floors where OSM has them (agreement) and counts what each tells (floors, the year). Politely: one request
// a house, a pause of 1.5 s, answers kept in data/answers.json (git ignores data/).
//   node evaluation/denmark/buildings-ab/run.mjs → vysledky/rezy.json and a summary
import fs from "node:fs";
import { kbhBuildingUrl, aarBuildingUrl, pick, kbhBuilding, aarBuilding } from "../../../pilot/public/towns/denmark.js";

const HERE = new URL("./", import.meta.url), CACHE = new URL("data/answers.json", HERE);
const OSM = new URL("../../../../../../data/osm/dk/dk_buildings.geojsonl", import.meta.url);
fs.mkdirSync(new URL("data/", HERE), { recursive: true });
const answers = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function cached(key, url) {
  if (!(key in answers)) {
    try { const r = await fetch(url, { headers: { "User-Agent": "profily-ulic" } }); answers[key] = r.ok ? await r.json() : { error: r.status }; } catch (err) { answers[key] = { error: err.message }; }
    fs.writeFileSync(CACHE, JSON.stringify(answers));
    await pause(1500);
  }
  return answers[key];
}
let seed = 20261130;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const inside = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const tag = (f, k) => new RegExp(`"${k.replace(":", "\\:")}"=>"([^"]*)"`).exec(f.properties.other_tags || "")?.[1];
const CENTRES = { kobenhavn: [55.680, 12.570, 0.025, 0.012], aarhus: [56.155, 10.205, 0.02, 0.01] };
const all = fs.readFileSync(OSM, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l.replace(/^\x1e/, "")))
  .filter((f) => /Polygon$/.test(f.geometry.type) && !["garage", "shed", "roof", "carport", "hut", "kiosk"].includes(f.properties.building))
  .map((f) => (f.geometry.type === "MultiPolygon" ? { ...f, geometry: { type: "Polygon", coordinates: f.geometry.coordinates[0] } } : f));
const rows = [];
for (const [town, [lat0, lon0, dLon, dLat]] of Object.entries(CENTRES)) {
  const near = all.filter((f) => { const c = f.geometry.coordinates[0][0]; return Math.abs(c[0] - lon0) < dLon && Math.abs(c[1] - lat0) < dLat; });
  for (const withLevels of [true, false]) {
    const pool = near.filter((f) => !!tag(f, "building:levels") === withLevels), picked = new Set();
    while (picked.size < Math.min(15, pool.length)) picked.add(Math.floor(rnd() * pool.length));
    for (const i of picked) {
      const f = pool[i], ring = f.geometry.coordinates[0];
      let [x, y] = ring.slice(0, -1).reduce(([sx, sy], [px, py], _, a) => [sx + px / a.length, sy + py / a.length], [0, 0]);
      if (!inside(ring, x, y)) [x, y] = [(ring[0][0] + ring[1][0] + ring[2][0]) / 3, (ring[0][1] + ring[1][1] + ring[2][1]) / 3];
      if (!inside(ring, x, y)) continue;
      const lat = +y.toFixed(7), lon = +x.toFixed(7);
      const json = await cached(`${town} ${lat},${lon}`, town === "kobenhavn" ? kbhBuildingUrl(lat, lon) : aarBuildingUrl(lat, lon));
      const p = json.error ? {} : town === "kobenhavn" ? pick(json, lat, lon, kbhBuilding, (q) => Number(q?.antaletager)) : pick(json, lat, lon, aarBuilding, (q) => Number(q?.Byg_Arl_Saml));
      const osmLevels = tag(f, "building:levels") ? parseInt(tag(f, "building:levels"), 10) + (parseInt(tag(f, "roof:levels"), 10) || 0) : null;
      rows.push({ town, lat, lon, building: f.properties.building, osmLevels, osmStart: tag(f, "start_date") ?? null, error: json.error ?? null,
        total: p.total ?? null, built: p.built ?? null, material: p.material ?? null, type: p.type ?? null, fromHeight: !!p.fromHeight });
    }
  }
}
fs.writeFileSync(new URL("vysledky/rezy.json", HERE), JSON.stringify(rows, null, 1));
for (const town of Object.keys(CENTRES)) {
  const r = rows.filter((x) => x.town === town), lv = r.filter((x) => x.osmLevels && x.total);
  const same = lv.filter((x) => x.total === x.osmLevels).length, near = lv.filter((x) => Math.abs(x.total - x.osmLevels) <= 1).length;
  console.log(`${town}: domů ${r.length}, chyby ${r.filter((x) => x.error).length}; podlaží zdroj ${r.filter((x) => x.total).length} / OSM ${r.filter((x) => x.osmLevels).length}; rok zdroj ${r.filter((x) => x.built).length} / OSM ${r.filter((x) => x.osmStart).length}; materiál ${r.filter((x) => x.material).length}; shoda podlaží s OSM ${same}/${lv.length} stejně, ${near}/${lv.length} do 1`);
}
