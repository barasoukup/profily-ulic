// Random sample of street cuts across Prague, stratified by OSM highway type.
// Length-weighted: every metre of a street in a stratum has the same chance.
// Usage: node evaluation/sample.mjs [seed]  → evaluation/data/samples.json
// Brno: CITY=brno node evaluation/sample.mjs → evaluation/brno/data/samples.json (OSM Brno, boundary of Brno).
import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
import { addWay, lengthWeighted } from "./lib/sample.js";

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

// Latitude of the town (any other town: the middle of its boundary).
const LAT = ({ praha: 50.08, brno: 49.2, jihlava: 49.4, most: 50.5, opava: 49.94, pardubice: 50.04, plzen: 49.75 })[CITY]
  ?? (Math.min(...rings.flat().map((p) => p[1])) + Math.max(...rings.flat().map((p) => p[1]))) / 2;
const kx = 111320 * Math.cos((LAT * Math.PI) / 180), ky = 110574;
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
  addWay(st, { id: p.osm_id, name: p.name, highway: p.highway, c, lens, len });
}

const { samples, report } = lengthWeighted(strata, QUOTA, { seed: SEED, minSpacing: MIN_SPACING, endGap: END_GAP, kx, ky, inside: inPrague });
for (const [hw, r] of Object.entries(report)) console.log(hw, ...(r.ways ? [`${r.got}/${r.n}`, `${r.ways} ways, ${(r.km).toFixed(0)} km`] : ["0 ways"]));
fs.writeFileSync(path.join(DATA, "samples.json"), JSON.stringify({ seed: SEED, quota: QUOTA, samples }, null, 1));
console.log(samples.length, "samples");
