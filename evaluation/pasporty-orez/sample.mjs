// New cuts for the A/B of the trim around a passport's roadway (towns/overlay.js trimGuessedRoads; Bára 26. 11. 2026):
// length-weighted random points on the town's local streets (OSM ways of data/osm/<town>_ways.geojsonl inside its
// boundary: residential, living_street, unclassified, tertiary, named service ways and alleys), none within 60 m of a
// cut of the town's earlier sample (evaluation/<town>/data/samples.json) nor 80 m of another new one, kept 15 m from
// a way's ends. Writes evaluation/<town>/data/samples-orez.json for evaluation/ab.mjs (SAMPLES=…).
//   node evaluation/pasporty-orez/sample.mjs roznov 150 [seed]
import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const [CITY, N = "100", S = "20261126"] = process.argv.slice(2);
let seed = Number(S);
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const DATA = path.join(ROOT, CITY, "data");
const border = JSON.parse(fs.readFileSync(path.join(DATA, `${CITY}_hranice.geojson`), "utf8"));
const rings = border.features.flatMap((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates)).flat();
const inside = (lon, lat) => { let c = false; for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c; } return c; };
const LAT = (Math.min(...rings.flat().map((p) => p[1])) + Math.max(...rings.flat().map((p) => p[1]))) / 2;
const kx = 111320 * Math.cos((LAT * Math.PI) / 180), ky = 110574, dist = (a, b) => Math.hypot((a[0] - b[0]) * kx, (a[1] - b[1]) * ky);
const tag = (o, k) => o?.match(new RegExp(`"${k}"=>"([^"]*)"`))?.[1];
const old = JSON.parse(fs.readFileSync(path.join(DATA, "samples.json"), "utf8")).samples;
const KINDS = new Set(["residential", "living_street", "unclassified", "tertiary", "service"]);
const segs = [];
let total = 0;
for await (const line of readline.createInterface({ input: fs.createReadStream(path.join(ROOT, "..", "data", "osm", `${CITY}_ways.geojsonl`)) })) {
  const f = JSON.parse(line), p = f.properties, o = p.other_tags || "";
  if (!KINDS.has(p.highway) || f.geometry.type !== "LineString") continue;
  if ((tag(o, "tunnel") && tag(o, "tunnel") !== "no") || tag(o, "area") === "yes") continue;
  if (p.highway === "service" && !(p.name || tag(o, "service") === "alley")) continue;
  const c = f.geometry.coordinates;
  if (!inside(c[0][0], c[0][1]) && !inside(c.at(-1)[0], c.at(-1)[1])) continue;
  const lens = c.slice(1).map((q, i) => dist(q, c[i])), len = lens.reduce((a, b) => a + b, 0);
  if (len < 40) continue;
  segs.push({ p, c, lens, len, from: total });
  total += len;
}
const out = [];
for (let tries = 0; out.length < Number(N) && tries < 20000; tries++) {
  const x = rnd() * total, w = segs.find((s) => x >= s.from && x < s.from + s.len);
  let d = x - w.from;
  if (d < 15 || w.len - d < 15) continue;
  let i = 0;
  while (d > w.lens[i]) d -= w.lens[i++];
  const [a, b] = [w.c[i], w.c[i + 1]], t = d / w.lens[i], pt = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  if (!inside(...pt) || old.some((q) => dist([q.lon, q.lat], pt) < 60) || out.some((q) => dist([q.lon, q.lat], pt) < 80)) continue;
  const bearing = Math.round((Math.atan2((b[0] - a[0]) * kx, (b[1] - a[1]) * ky) * 180) / Math.PI);
  out.push({ n: out.length + 1, highway: w.p.highway, wayId: w.p.osm_id, name: w.p.name || null, lat: +pt[1].toFixed(6), lon: +pt[0].toFixed(6), bearing });
}
fs.writeFileSync(path.join(DATA, "samples-orez.json"), JSON.stringify({ seed: Number(S), samples: out }, null, 1));
console.log(CITY, out.length);
