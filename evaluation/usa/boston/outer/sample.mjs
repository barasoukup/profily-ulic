// The A/B of the outer gaps (towns/planimetrics.js outerGaps, 26. 11. 2026; ZPRAVA.md): new arterials of Boston and
// Cambridge, by sample.mjs's method with a seed of their own and none within 150 m of the fresh measurement's cuts (fresh.json)
// or of each other: node evaluation/usa/boston/outer/sample.mjs 90 (writes sample.json, variants def and og0).
// sample.mjs's head: the fresh measurement of Boston's and Cambridge's surface maps (Bára 26. 11. 2026; ZPRAVA.md here), the method of
// evaluation/usa/fresh/sample.mjs and evaluation/canada/sample.mjs: random cuts in the proportion of the street network of
// the two cities (a random point of the whole length, a fixed seed), none within 150 m of the points tried while the maps
// were wired (TRIED), each with a Mapillary photo within 30 m. Variants: def (the map) and bos0 (?boston=0&cambridge=0).
//   OSM tiles: evaluation/usa/boston/data/osm-tiles (tools/build_osm_data.sh of the us_bos extract)
//   node evaluation/usa/boston/sample.mjs 60    (writes fresh.json)
import fs from "node:fs/promises";
import path from "node:path";
import { decodeTile, mergePieces } from "../../../../pilot/public/osmtile.js";
import { inside } from "../../../../pilot/public/places.js";
const DATA = new URL("../data/", import.meta.url).pathname;
process.env.OSM_TILES = path.join(DATA, "osm-tiles");
const { placeCut } = await import("../../../usa-dc/lib.mjs");
const COUNT = Number(process.argv[2] || 60);
const HERE = path.dirname(new URL(import.meta.url).pathname), read = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
const OLDCUTS = JSON.parse(await fs.readFile(new URL("../fresh.json", import.meta.url), "utf8")).map(({ lat, lon }) => ({ lat, lon }));
const TRIED = [[42.35195, -71.0817], [42.37387, -71.10245], [42.36575, -71.10442], [42.337, -71.075], [42.3603, -71.0578], [42.3432, -71.1216]].map(([lat, lon]) => ({ lat, lon })).concat(OLDCUTS);
const towns = await read("../../../../pilot/public/mesta-us.json");
const AREA = { boston: towns.boston, cambridge: towns.cambridge };
const townAt = (x, y) => Object.keys(AREA).find((k) => inside(AREA[k], x, y));
const KIND = { motorway: "motorway", motorway_link: "motorway", trunk: "arterial", trunk_link: "arterial", primary: "arterial", primary_link: "arterial", secondary: "arterial", secondary_link: "arterial",
  tertiary: "collector", tertiary_link: "collector", residential: "local", unclassified: "local", living_street: "local", service: "service" };
const NOT = new Set(["driveway", "parking_aisle", "drive-through", "emergency_access"]);
let seed = 20261127;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const KX = 82230;
const [bx0, by0, bx1, by1] = [-71.2, 42.22, -70.95, 42.41];
const names = (await fs.readdir(path.join(DATA, "osm-tiles"))).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).sort();
// (Only the tiles over the two cities: osmtile.js TILE.)
const wanted = names.filter((f) => { const [ix, iy] = f.slice(0, -5).split("_").map(Number); return ix * 0.005 <= bx1 && (ix + 1) * 0.005 >= bx0 && iy * 0.005 <= by1 && (iy + 1) * 0.005 >= by0; });
const tiles = await Promise.all(wanted.map(async (f) => decodeTile(await fs.readFile(path.join(DATA, "osm-tiles", f), "utf8"))));
const ok = (el) => { const t = el.tags || {}; return el.type === "way" && KIND[t.highway] && !NOT.has(t.service) && !(t.tunnel && t.tunnel !== "no") && !(t.bridge && t.bridge !== "no") && t.area !== "yes" && t.covered !== "yes" && !(Number(t.layer) < 0) && !/private|no/.test(t.access || ""); };
const segs = [], byKind = {};
let total = 0;
for (const w of mergePieces(tiles).filter(ok).sort((a, b) => a.id - b.id)) for (let i = 1; i < w.geometry.length; i++) {
  const [a, b] = [w.geometry[i - 1], w.geometry[i]], len = Math.hypot((b.lon - a.lon) * KX, (b.lat - a.lat) * 110574);
  if (!len || !townAt((a.lon + b.lon) / 2, (a.lat + b.lat) / 2)) continue;
  segs.push({ a, b, from: total, len, w }); total += len;
  byKind[KIND[w.tags.highway]] = (byKind[KIND[w.tags.highway]] || 0) + len;
}
for (const [k, v] of Object.entries(byKind)) console.error(k, (v / 1000).toFixed(0), "km", ((100 * v) / total).toFixed(0), "%");
const TOKEN = (await fs.readFile(process.env.TOKEN || path.join(HERE, "..", "..", "..", "streetview", "token.local"), "utf8")).trim();
async function photoNear(lat, lon) {
  await new Promise((r) => setTimeout(r, 300));
  const r = await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat, lng: lon, radius: 30, limit: 5, fields: "id" })}`);
  return r.ok ? ((await r.json()).data || []).length : 0;
}
const out = [], drop = {};
const skip = (kind, why) => { (drop[kind] ??= {})[why] = (drop[kind][why] || 0) + 1; };
for (let tries = 0; out.length < COUNT && tries < 20000; tries++) {
  const d = rnd() * total, s = segs.find((x) => d < x.from + x.len), f = (d - s.from) / s.len;
  const c = await placeCut(s.a.lat + (s.b.lat - s.a.lat) * f, s.a.lon + (s.b.lon - s.a.lon) * f);
  const kind = KIND[s.w.tags.highway];
  if (kind !== "arterial") continue;
  if (!c || KIND[c.way.tags.highway] !== kind) { skip(kind, "snapped to another type"); continue; }
  if ([...out, ...TRIED].some((o) => Math.hypot((o.lat - c.lat) * 110574, (o.lon - c.lon) * KX) < 150)) { skip(kind, "near an old point"); continue; }
  if (!(await photoNear(c.lat, c.lon))) { skip(kind, "no photo"); continue; }
  out.push({ id: `bo-${out.length + 1}`, country: "US", town: townAt(c.lon, c.lat) || "boston", kind, name: c.way.tags.name || "", highway: c.way.tags.highway, wayId: c.way.id,
    lat: +c.lat.toFixed(7), lon: +c.lon.toFixed(7), bearing: +c.bearing.toFixed(1), variants: ["def", "og0"] });
}
console.error("vynecháno", JSON.stringify(drop));
await fs.writeFile(path.join(HERE, "sample.json"), JSON.stringify(out, null, 1));
