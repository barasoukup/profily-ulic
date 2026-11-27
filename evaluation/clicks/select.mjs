// The pairs of the A/B of placement (blind, packages.mjs): where two variants of a fresh collection (collect.mjs, seed 4242)
// differ: S none/now (junction rules of service ways off and on) over 15 m, Berlin also from 5 m; L limit/now over 5 m;
// A old/now (the alley's area) on service ways inside such areas (Polish cities' OSM, Washington's map). At most PER a city.
//   OLD=… TRIAL=… node evaluation/clicks/select.mjs data/fresh.json → data/pary.json
import fs from "node:fs/promises";
import path from "node:path";
import { osmAt, ROOT, isDC } from "./osm.mjs";
import { place } from "./collect.mjs";
import * as D from "../../app/public/derive.js";
let seed = 31337; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const dist = (a, b) => Math.hypot((a.lat - b.lat) * 110574, (a.lon - b.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180));
const rows = JSON.parse(await fs.readFile(path.join(ROOT, process.argv[2]), "utf8")).filter((r) => r.kind !== "foot" && r.kind !== "parking"), pairs = [];
const norm = (v) => ({ lat: v.lat, lon: v.lon, bearing: v.bearing > 90 ? +(v.bearing - 180).toFixed(1) : v.bearing <= -90 ? +(v.bearing + 180).toFixed(1) : v.bearing, moved: v.moved });
const add = (set, r, base) => { const id = `${r.id}`; const same = pairs.find((p) => p.id === id && dist(p.O, norm(r.v[base])) < 1); if (same) { same.sets.push(set); return; }
  pairs.push({ pid: `${set}${pairs.length + 1}`, id, sets: [set], city: r.city, country: r.country, lat: r.lat, lon: r.lon, way: r.way, kind: r.kind, highway: r.highway, name: r.name, len: r.len, O: norm(r.v[base]), N: norm(r.v.now) }); };
const PER = 4;
// U=1: the second round, unsat/now over 5 m, at most 6 a city, of data/fresh2.json.
if (process.env.U) {
  for (const city of [...new Set(rows.map((r) => r.city))]) for (const r of shuffle(rows.filter((r) => r.city === city && dist(r.v.unsat, r.v.now) > 5)).slice(0, 6)) add("U", r, "unsat");
  await fs.writeFile(path.join(ROOT, "data/pary2.json"), JSON.stringify(pairs));
  console.log(pairs.length);
  process.exit(0);
}
for (const city of [...new Set(rows.map((r) => r.city))]) {
  const mine = shuffle(rows.filter((r) => r.city === city));
  const L = mine.filter((r) => dist(r.v.limit, r.v.now) > 5).slice(0, PER);
  for (const r of L) add("L", r, "limit");
  const berlin = city === "berlin";
  for (const r of mine.filter((r) => dist(r.v.none, r.v.now) > (berlin ? 5 : 15)).slice(0, berlin ? 16 : PER)) add("S", r, "none");
}
for (const r of rows.filter((r) => dist(r.v.old, r.v.now) > 3)) add("A", r, "old");
// The service ways inside an alley's area.
const inPoly = (g, lon, lat) => { let c = false; for (let i = 0, j = g.length - 1; i < g.length; j = i++) if (g[i].lat > lat !== g[j].lat > lat && lon < ((g[j].lon - g[i].lon) * (lat - g[i].lat)) / (g[j].lat - g[i].lat) + g[i].lon) c = !c; return c; };
for (const [city, lat, lon, country, max] of [["warszawa", 52.2297, 21.0122, "PL", 3], ["gdansk", 54.356, 18.655, "PL", 3], ["wroclaw", 51.1079, 17.0385, "PL", 2], ["krakow", 50.0614, 19.9366, "PL", 3], ["lodz", 51.7687, 19.4569, "PL", 3], ["poznan", 52.4082, 16.9335, "PL", 3], ["szczecin", 53.4285, 14.5528, "PL", 3],
  ["washington", 38.905, -77.03, "US", 8]]) {
  const o = await osmAt(lat, lon, city === "washington" ? 2500 : 2000, false), all = shuffle(o.elements.filter((e) => e.type === "way" && e.tags?.highway === "service" && e.geometry?.length > 1));
  const areas = o.elements.filter((e) => e.type === "area" && (e.tags?.["area:highway"] === "service" || e.tags?.service === "alley"));
  let n = 0, asked = 0;
  for (const w of all) {
    if (n >= max || asked > 60) break;
    const i = Math.max(1, Math.floor(w.geometry.length / 2)), m = { lat: (w.geometry[i - 1].lat + w.geometry[i].lat) / 2, lon: (w.geometry[i - 1].lon + w.geometry[i].lon) / 2 };
    if (isDC(m.lat, m.lon)) { if (w.tags.service !== "alley") continue; asked++; } else if (!areas.some((a) => inPoly(a.geometry, m.lon, m.lat))) continue;
    const r = await place({ id: `${city}-a${w.id}`, city, country, ...{ lat: +m.lat.toFixed(6), lon: +m.lon.toFixed(6) } });
    if (!r || r.way !== w.id || dist(r.v.old, r.v.now) <= 5) continue;
    n++; add("A", r, "old");
  }
  console.log(city, "uličky", n);
}
await fs.writeFile(path.join(ROOT, "data/pary.json"), JSON.stringify(pairs, null, 0));
console.log(pairs.length, ["S", "L", "A"].map((s) => `${s} ${pairs.filter((p) => p.sets.includes(s)).length}`).join(" "), "oboje", pairs.filter((p) => p.sets.length > 1).length);
