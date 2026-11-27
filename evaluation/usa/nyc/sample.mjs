// The fresh measurement of New York's map (26. 11. 2026; ZPRAVA.md here), drawn after the code was frozen (18945f8): 50 random
// cuts of the five boroughs' streets in the proportion of the network (a random point of the whole length, so each type as
// often as it is long; a fixed seed), at least 150 m apart and away from the points tried while the code was written. A
// Mapillary photo within 30 m is counted (photos) but not required: required, it dropped 56 local streets and the sample
// was a fifth motorways (the first draw); the A/B judges a cut without a photo by the orthophoto, the universal measurement
// takes only the cuts with one. No tunnels, bridges nor covered ways; of service roads not driveways, parking aisles and
// drive-throughs (the universal measurement leaves them out). As ../fresh/sample.mjs (Washington). Writes sample.json.
//   OSM_TILES=data/osm/tiles-us_nyc node evaluation/usa/nyc/sample.mjs
// (data/osm/tiles-us_nyc: tools/build_osm_data.sh of Geofabrik's New York cut to the pack's box, tools/countries.mjs us_nyc.)
import fs from "node:fs/promises";
import path from "node:path";
import { decodeTile, mergePieces } from "../../../app/public/osmtile.js";
import { inside } from "../../../app/public/places.js";
import { placeCut } from "../../usa-dc/lib.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname), read = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
const TILES = process.env.OSM_TILES;
if (!TILES) throw new Error("OSM_TILES=…/tiles-us_nyc");
// Where the code was tried (Amsterdam Avenue, Queens Boulevard twice, Broadway at 72nd Street).
const OLD = [[40.781041, -73.97986], [40.7365, -73.877], [40.74366, -73.922988], [40.7785, -73.9819]].map(([lat, lon]) => ({ lat, lon }));
const NYC = (await read("../../../app/public/towns-us.json")).newyork;
const KIND = { motorway: "motorway", motorway_link: "motorway", trunk: "arterial", trunk_link: "arterial", primary: "arterial", primary_link: "arterial", secondary: "arterial", secondary_link: "arterial",
  tertiary: "collector", tertiary_link: "collector", residential: "local", unclassified: "local", living_street: "local", service: "service" };
const NOT = new Set(["driveway", "parking_aisle", "drive-through", "emergency_access"]);
// PHOTO=1: the second draw for the universal measurement only (it judges by photos): 25 cuts with a photo, away from the first
// draw's, into sample-u.json (another seed; the proportion of the network does not hold, see ZPRAVA.md).
const PHOTO = process.env.PHOTO === "1", N = Number(process.env.N || (PHOTO ? 25 : 50));
if (PHOTO) OLD.push(...await read("sample.json"));
let seed = PHOTO ? 20261128 : 20261127;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const tiles = await Promise.all((await fs.readdir(TILES)).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).sort().map(async (f) => decodeTile(await fs.readFile(path.join(TILES, f), "utf8"))));
const ok = (el) => { const t = el.tags || {}; return el.type === "way" && KIND[t.highway] && !NOT.has(t.service) && !(t.tunnel && t.tunnel !== "no") && !(t.bridge && t.bridge !== "no") && t.area !== "yes" && t.covered !== "yes" && !(Number(t.layer) < 0) && !/private|no/.test(t.access || ""); };
const segs = [], byKind = {};
let total = 0;
for (const w of mergePieces(tiles).filter(ok).sort((a, b) => a.id - b.id)) for (let i = 1; i < w.geometry.length; i++) {
  const [a, b] = [w.geometry[i - 1], w.geometry[i]], len = Math.hypot((b.lon - a.lon) * 84400, (b.lat - a.lat) * 110574);
  if (!len || !inside(NYC, (a.lon + b.lon) / 2, (a.lat + b.lat) / 2)) continue;
  segs.push({ a, b, from: total, len, w }); total += len;
  byKind[KIND[w.tags.highway]] = (byKind[KIND[w.tags.highway]] || 0) + len;
}
for (const [k, v] of Object.entries(byKind)) console.error(k, (v / 1000).toFixed(0), "km", ((100 * v) / total).toFixed(0), "%");
const TOKEN = (await fs.readFile(new URL("../../streetview/token.local", import.meta.url), "utf8")).trim();
async function photoNear(lat, lon) {
  await new Promise((r) => setTimeout(r, 300));
  const r = await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat, lng: lon, radius: 30, limit: 5, fields: "id" })}`);
  return r.ok ? ((await r.json()).data || []).length : 0;
}
const out = [], drop = {};
const skip = (kind, why) => { (drop[kind] ??= {})[why] = (drop[kind][why] || 0) + 1; };
for (let tries = 0; out.length < N && tries < 2000; tries++) {
  const d = rnd() * total, s = segs.find((x) => d < x.from + x.len), f = (d - s.from) / s.len;
  const c = await placeCut(s.a.lat + (s.b.lat - s.a.lat) * f, s.a.lon + (s.b.lon - s.a.lon) * f);
  const kind = KIND[s.w.tags.highway];
  if (!c || KIND[c.way.tags.highway] !== kind) { skip(kind, "snapped to another type"); continue; }
  if ([...out, ...OLD].some((o) => Math.hypot((o.lat - c.lat) * 110574, (o.lon - c.lon) * 84400) < 150)) { skip(kind, "near an old point"); continue; }
  const photos = await photoNear(c.lat, c.lon);
  if (PHOTO && !photos) { skip(kind, "no photo"); continue; }
  out.push({ id: `${PHOTO ? "u" : "n"}-${out.length + 1}`, country: "US", town: "newyork", kind, name: c.way.tags.name || "", highway: c.way.tags.highway, wayId: c.way.id,
    lat: +c.lat.toFixed(7), lon: +c.lon.toFixed(7), bearing: +c.bearing.toFixed(1), photos, variants: ["def", "nyc0"] });
}
console.error("vynecháno", JSON.stringify(drop));
await fs.writeFile(path.join(HERE, PHOTO ? "sample-u.json" : "sample.json"), JSON.stringify(out, null, 1));
