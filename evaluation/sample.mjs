// Random sample of street cuts across Prague, stratified by OSM highway type.
// Length-weighted: every metre of a street in a stratum has the same chance.
// Usage: node evaluation/sample.mjs [seed]  → evaluation/data/samples.json
// Brno: CITY=brno node evaluation/sample.mjs → evaluation/brno/data/samples.json (OSM Brno, boundary of Brno).
import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";

const BRNO = process.env.CITY === "brno";
// Jihlava: CITY=jihlava → evaluation/jihlava/data/samples.json (OSM Jihlava, boundary of the town).
const CITY = process.env.CITY || "praha"; // or a town of tools/cities.mjs
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DATA = path.join(ROOT, ...(CITY === "praha" ? ["data"] : [CITY, "data"]));
const WAYS = path.join(ROOT, "..", "data", "osm", `${CITY}_ways.geojsonl`);
const SEED = Number(process.argv[2] || 20261106);

// Number of cuts per street type (sums to 100).
const QUOTA = {
  trunk: 6, primary: 14, secondary: 14, tertiary: 16, unclassified: 6,
  residential: 28, living_street: 8, pedestrian: 4, service: 4,
};
const MIN_SPACING = 300; // m between two sampled cuts
const END_GAP = 15; // keep away from way ends (junctions), m

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);

// Prague administrative boundary (OSM, admin_level 4/6/8 "Praha").
const border = JSON.parse(fs.readFileSync(path.join(DATA, `${CITY}_hranice.geojson`), "utf8"));
const rings = border.features.flatMap((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates)).flat();
function inPrague(lon, lat) {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const kx = 111320 * Math.cos((({ praha: 50.08, brno: 49.2, jihlava: 49.4, most: 50.5, opava: 49.94, plzen: 49.75 })[CITY] * Math.PI) / 180), ky = 110574;
const dist = (a, b) => Math.hypot((a[0] - b[0]) * kx, (a[1] - b[1]) * ky);
const tag = (other, k) => other?.match(new RegExp(`"${k}"=>"([^"]*)"`))?.[1];

const strata = Object.fromEntries(Object.keys(QUOTA).map((k) => [k, { ways: [], total: 0 }]));
const rl = readline.createInterface({ input: fs.createReadStream(WAYS) });
for await (const line of rl) {
  const f = JSON.parse(line);
  const p = f.properties;
  const st = strata[p.highway];
  if (!st || f.geometry.type !== "LineString") continue;
  const o = p.other_tags || "";
  if (tag(o, "tunnel") && tag(o, "tunnel") !== "no") continue;
  if (tag(o, "area") === "yes" || tag(o, "indoor") === "yes") continue;
  // Service ways: only named ones and alleys, not parking aisles or driveways.
  if (p.highway === "service" && !(p.name || tag(o, "service") === "alley")) continue;
  if (["pedestrian", "living_street", "residential", "unclassified"].includes(p.highway) && !p.name) continue;
  const c = f.geometry.coordinates;
  if (!inPrague(c[0][0], c[0][1]) && !inPrague(c.at(-1)[0], c.at(-1)[1])) continue;
  const lens = c.slice(1).map((q, i) => dist(q, c[i]));
  const len = lens.reduce((a, b) => a + b, 0);
  if (len < 2 * END_GAP + 5) continue;
  st.ways.push({ id: p.osm_id, name: p.name, highway: p.highway, c, lens, len, cum: st.total });
  st.total += len;
}

function pointAt(w, s) {
  for (let i = 0; i < w.lens.length; i++) {
    if (s <= w.lens[i] || i === w.lens.length - 1) {
      const t = Math.min(1, s / w.lens[i]);
      const [a, b] = [w.c[i], w.c[i + 1]];
      const bearing = (Math.atan2((b[0] - a[0]) * kx, (b[1] - a[1]) * ky) * 180) / Math.PI;
      return { lon: a[0] + t * (b[0] - a[0]), lat: a[1] + t * (b[1] - a[1]), bearing };
    }
    s -= w.lens[i];
  }
}

const samples = [];
for (const [hw, n] of Object.entries(QUOTA)) {
  const st = strata[hw];
  if (!st.ways.length) { console.log(hw, "0 ways"); continue; } // a town without such streets (Most: no secondary)
  let got = 0, tries = 0;
  while (got < n && tries++ < 5000) {
    const x = rnd() * st.total;
    let lo = 0, hi = st.ways.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (st.ways[m].cum <= x) lo = m; else hi = m - 1; }
    const w = st.ways[lo];
    const s = x - w.cum;
    if (s < END_GAP || s > w.len - END_GAP) continue;
    const p = pointAt(w, s);
    if (!inPrague(p.lon, p.lat)) continue;
    if (samples.some((q) => dist([q.lon, q.lat], [p.lon, p.lat]) < MIN_SPACING)) continue;
    samples.push({ n: samples.length + 1, highway: hw, wayId: w.id, name: w.name || null, lat: +p.lat.toFixed(6), lon: +p.lon.toFixed(6), bearing: Math.round(p.bearing) });
    got++;
  }
  console.log(hw, `${got}/${n}`, `${st.ways.length} ways, ${(st.total / 1000).toFixed(0)} km`);
}
fs.writeFileSync(path.join(DATA, "samples.json"), JSON.stringify({ seed: SEED, quota: QUOTA, samples }, null, 1));
console.log(samples.length, "samples");
