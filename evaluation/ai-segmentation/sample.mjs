// Patches for the AI segmentation pilot (Bára 17. 11. 2026): random squares of 64 m around streets of cities whose
// own map of surfaces the app reads (Prague and Brno MTVU, Vienna FMZK, Berlin Straßenbefahrung, Hamburg
// Feinkartierung), each with that map's polygons as MTVU codes. One request per patch to the city's map, a pause
// between them; the orthophoto is fetched afterwards (fetch_ortho.py), only for the patches kept.
//   node evaluation/ai-segmentation/sample.mjs praha 250
// Writes data/ai-seg/patches/<city>/<n>.json (data/ is outside git).
import fs from "node:fs";
import { setCity, sources } from "./labels-lib.mjs";
const germany = await import("../../app/public/towns/germany.js");
const { FMZK, fmzkCode, WIEN_WFS } = await import("../../app/public/towns/austria.js");
const { SK_TOWNS } = await import("../../app/public/towns/slovakia.js");

const OUT = new URL("../../../../../data/ai-seg/patches/", import.meta.url); // the main checkout's data/
const HALF = 32; // m: a patch of 64 m (320 px of 20 cm)
const PAUSE = 700;
// Boxes of the dense city where the map covers the streets (lon0, lat0, lon1, lat1).
export const CITIES = {
  praha: { box: [14.34, 50.03, 14.52, 50.12], city: "praha" },
  brno: { box: [16.56, 49.17, 16.66, 49.23], city: "brno" },
  wien: { box: [16.30, 48.17, 16.43, 48.24], city: "wien" },
  berlin: { box: [13.28, 52.47, 13.49, 52.56], city: "germany", none: 0.6 }, // streets only, no blocks
  hamburg: { box: [9.93, 53.53, 10.08, 53.60], city: "germany", none: 0.6 },
  // Slovak towns' passports as teachers on ZBGIS's orthophoto (streets only, like Berlin); Bratislava, Prešov and
  // Žilina stay for the test in the target area (target-truth.mjs).
  // Bratislava's passport outside the test's box (target-points.mjs: 17.08–17.16, 48.13–48.17): Petržalka and Ružinov.
  // (Košice's passport covers little of the town yet, Banská Bystrica's one try in fifteen: 18. 11. 2026.)
  petrzalka: { box: [17.09, 48.1, 17.14, 48.125], city: "slovensko", none: 0.6, sk: "bratislava" },
  ruzinov: { box: [17.165, 48.14, 17.21, 48.17], city: "slovensko", none: 0.6, sk: "bratislava" },
};
// MTVU codes → the classes of the model (0: no data, ignored when training).
export const CLASSES = ["none", "roadway", "sidewalk", "cycleway", "parking", "tram", "green", "building", "paved", "water"];
const CLASS_OF = { 700: 1, 701: 1, 702: 2, 703: 3, 704: 4, 705: 5, 100: 6, 200: 6, 300: 6, 401: 6, 402: 6, 601: 7, 602: 7,
  603: 8, 901: 8, 1003: 8, 1100: 8, 501: 9, 502: 9, 503: 9 };

async function wien(bbox) {
  const layers = ["FMZKGEBOGD", "FMZKVERKEHR1OGD", "FMZKVERKEHR2OGD", "FMZKGRUEN2OGD", "FMZKGEWOGD", "FMZKMAUOGD"];
  const out = [];
  for (const t of layers) {
    const r = await fetch(`${WIEN_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: `ogdwien:${t}`,
      srsName: "EPSG:4326", outputFormat: "application/json", bbox: `${bbox},EPSG:4326`, count: 3000 })}`);
    if (!r.ok) throw new Error(`FMZK ${r.status}`);
    for (const f of (await r.json()).features || []) {
      const g = f.geometry, rings = g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null;
      const code = fmzkCode(f.properties || {});
      if (rings && code) out.push({ code, rings });
    }
  }
  return out;
}
// The city's own polygons, without the app's rule "only where a street lies at the centre" (labels need them all).
async function labels(id, bbox) {
  if (id === "praha" || id === "brno") {
    const j = await sources.mtvu(bbox);
    return (j.features || []).map((f) => ({ code: f.attributes.CTVUK_KOD, rings: f.geometry?.rings })).filter((f) => f.rings);
  }
  if (id === "wien") return wien(bbox);
  if (CITIES[id].sk) {
    const j = await SK_TOWNS[CITIES[id].sk].own(bbox);
    return (j.features || []).map((f) => ({ code: f.attributes.CTVUK_KOD, rings: f.geometry?.rings })).filter((f) => f.rings && f.code);
  }
  const j = await germany.DE_TOWNS[id](bbox);
  return (j.features || []).map((f) => ({ code: f.attributes.code, rings: f.geometry?.rings })).filter((f) => f.rings && f.code);
}

const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
// The share of each class on a grid of 24 × 24 points (later polygons win, as when drawn).
function shares(feats, box) {
  const n = 24, count = new Array(CLASSES.length).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = box[0] + ((i + 0.5) / n) * (box[2] - box[0]), y = box[1] + ((j + 0.5) / n) * (box[3] - box[1]);
    let c = 0;
    for (const f of feats) if (CLASS_OF[f.code] && inRings(f.rings, x, y)) c = CLASS_OF[f.code];
    count[c]++;
  }
  return count.map((v) => v / (n * n));
}

// The mix of street kinds (OSM highway) the patches are centred on.
const MIX = [[0.4, /^(residential|living_street)$/], [0.25, /^(tertiary|unclassified)$/], [0.25, /^(primary|secondary)$/], [0.1, /^service$/]];
const pick = (r) => { for (const [w, re] of MIX) { if (r < w) return re; r -= w; } return MIX[0][1]; };
// The nearest point of an OSM way of that kind within 80 m (from the app's own tiles), or null.
async function snap([lon, lat], re) {
  const j = await sources.osm(lat, lon, 80);
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  let best = null, bd = 80;
  for (const e of j.elements || []) {
    if (e.type !== "way" || !re.test(e.tags?.highway || "") || !e.geometry?.length || e.tags.tunnel || e.tags.bridge) continue;
    for (let i = 0; i + 1 < e.geometry.length; i++) {
      const a = e.geometry[i], b = e.geometry[i + 1];
      const ax = (a.lon - lon) * kx, ay = (a.lat - lat) * ky, bx = (b.lon - lon) * kx, by = (b.lat - lat) * ky;
      const L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1, t = Math.max(0, Math.min(1, -(ax * (bx - ax) + ay * (by - ay)) / L2));
      const x = ax + t * (bx - ax), y = ay + t * (by - ay), d = Math.hypot(x, y);
      if (d < bd) { bd = d; best = [lon + x / kx, lat + y / ky]; }
    }
  }
  return best;
}

// A seeded random (the same patches on every run).
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

async function main() {
  const [id, want = "200"] = process.argv.slice(2);
  const c = CITIES[id];
  if (!c) { console.error(`city: ${Object.keys(CITIES).join(", ")}`); process.exit(1); }
  setCity(c.city);
  const dir = new URL(`${id}/`, OUT);
  fs.mkdirSync(dir, { recursive: true });
  const rand = rng([...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
  // the patches so far (not their .osm.json), and the next free number
  const have = fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).map((f) => parseInt(f));
  let kept = have.length, tried = 0, next = have.length ? Math.max(...have) + 1 : 0;
  for (let k = 0; k < kept * 4; k++) rand(); // continue the same sequence after an interrupted run (roughly)
  while (kept < Number(want) && tried < Number(want) * 6) {
    tried++;
    // A characteristic street (Bára 18. 11. 2026: "učit na charakteristických místech"): a random point snapped to an
    // OSM street of a kind drawn by the mix below, so a patch has a street at its centre as a cut has.
    const kind = pick(rand());
    const p0 = [c.box[0] + rand() * (c.box[2] - c.box[0]), c.box[1] + rand() * (c.box[3] - c.box[1])];
    const near = await snap(p0, kind);
    if (!near) continue;
    const [lon, lat] = near;
    const dy = HALF / 110574, dx = HALF / (111320 * Math.cos((lat * Math.PI) / 180));
    const box = [lon - dx, lat - dy, lon + dx, lat + dy];
    const bbox = box.map((v) => v.toFixed(7)).join(",");
    let feats;
    try { feats = await labels(id, bbox); } catch (e) { console.log(`#${tried} ${e.message}`); await new Promise((r) => setTimeout(r, PAUSE * 5)); continue; }
    const s = shares(feats, box);
    // Streets in it (roadway 8–65 %) and the map's polygons over most of it.
    const ok = s[1] >= 0.08 && s[1] <= 0.65 && s[0] <= (c.none ?? 0.35);
    if (process.env.DEBUG) console.log(kind, s.map((v) => v.toFixed(2)).join(" "), feats.length);
    if (ok) {
      fs.writeFileSync(new URL(`${next}.json`, dir), JSON.stringify({ id, n: next++, lat, lon, box, half: HALF, shares: s.map((v) => +v.toFixed(3)), feats }));
      kept++;
    }
    if (tried % 10 === 0) console.log(`${id}: ${kept}/${want} kept of ${tried}`);
    await new Promise((r) => setTimeout(r, PAUSE));
  }
  console.log(`${id}: ${kept} patches (${tried} tried)`);
}
