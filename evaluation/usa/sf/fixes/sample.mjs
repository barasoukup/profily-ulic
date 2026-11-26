// The A/B of the fixes of 27. 11. 2026 (ZPRAVA.md): random cuts on the streets a fix touches, by sample.mjs's method
// (a random point of their length, a fixed seed, a Mapillary photo within 30 m), none within 150 m of the fresh measurement's
// cuts (fresh.json) or of each other: node evaluation/usa/sf/fixes/sample.mjs angled 45 (the ways OSM tags with diagonal or
// perpendicular parking on a side; writes sample.json; variants def and sfold: ?off=sfosmpark,axisroad).
// sample.mjs's head: random cuts of San Francisco (evaluation/usa/sf, 26. 11. 2026): node evaluation/usa/sf/sample.mjs fresh 60. The method of
// evaluation/usa/fresh/sample.mjs, whose code this is: the proportion of the network (a random point of the whole length),
// a fixed seed, none within 150 m of the points tried while the map was written (TRIED), a Mapillary photo within 30 m.
import fs from "node:fs/promises";
import path from "node:path";
import { decodeTile, mergePieces } from "../../../../pilot/public/osmtile.js";
import { inside } from "../../../../pilot/public/places.js";
const ROOT = new URL("../../../usa-dc/", import.meta.url).pathname, DATA = new URL("../data/", import.meta.url).pathname;
process.env.OSM_TILES = path.join(DATA, "osm-tiles");
const { placeCut } = await import("../../../usa-dc/lib.mjs");
const [WHAT, COUNT] = [process.argv[2], Number(process.argv[3])], SEEDS = { angled: 20261127 };
const HERE = path.dirname(new URL(import.meta.url).pathname), read = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
const TRIED = [[37.7612, -122.4216], [37.7848, -122.4071], [37.78195, -122.40975], [37.759, -122.4191], [37.76, -122.4148], [37.757, -122.425], [37.7577, -122.4154], [37.7546, -122.419], [37.7816, -122.41], [37.7838, -122.4075]
].map(([lat, lon]) => ({ lat, lon }));
const OLD = [...TRIED, ...(await read("../fresh.json")).map(({ lat, lon }) => ({ lat, lon }))];
const DC = (await read("../../../../pilot/public/mesta-us.json")).sanfrancisco;
const KIND = { motorway: "motorway", motorway_link: "motorway", trunk: "arterial", trunk_link: "arterial", primary: "arterial", primary_link: "arterial", secondary: "arterial", secondary_link: "arterial",
  tertiary: "collector", tertiary_link: "collector", residential: "local", unclassified: "local", living_street: "local", service: "service" };
const NOT = new Set(["driveway", "parking_aisle", "drive-through", "emergency_access"]);
let seed = SEEDS[WHAT];
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const tiles = await Promise.all((await fs.readdir(path.join(DATA, "osm-tiles"))).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).sort().map(async (f) => decodeTile(await fs.readFile(path.join(DATA, "osm-tiles", f), "utf8"))));
const ANGLED = /^(diagonal|perpendicular)$/;
const angled = (t) => ["left", "right", "both"].some((k) => ANGLED.test(t[`parking:${k}:orientation`] || "") || ANGLED.test(t[`parking:lane:${k}`] || ""));
const TARGET = { angled };
const ok = (el) => { const t = el.tags || {}; return TARGET[WHAT](t) && el.type === "way" && KIND[t.highway] && !NOT.has(t.service) && !(t.tunnel && t.tunnel !== "no") && !(t.bridge && t.bridge !== "no") && t.area !== "yes" && t.covered !== "yes" && !(Number(t.layer) < 0) && !/private|no/.test(t.access || ""); };
const segs = [], byKind = {};
let total = 0;
for (const w of mergePieces(tiles).filter(ok).sort((a, b) => a.id - b.id)) for (let i = 1; i < w.geometry.length; i++) {
  const [a, b] = [w.geometry[i - 1], w.geometry[i]], len = Math.hypot((b.lon - a.lon) * 88000, (b.lat - a.lat) * 110574);
  if (!len || !inside(DC, (a.lon + b.lon) / 2, (a.lat + b.lat) / 2)) continue;
  segs.push({ a, b, from: total, len, w }); total += len;
  byKind[KIND[w.tags.highway]] = (byKind[KIND[w.tags.highway]] || 0) + len;
}
for (const [k, v] of Object.entries(byKind)) console.error(k, (v / 1000).toFixed(0), "km", ((100 * v) / total).toFixed(0), "%");
const TOKEN = (await fs.readFile(process.env.TOKEN || path.join(ROOT, "..", "streetview", "token.local"), "utf8")).trim();
async function photoNear(lat, lon) {
  await new Promise((r) => setTimeout(r, 300));
  const r = await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat, lng: lon, radius: 30, limit: 5, fields: "id" })}`);
  return r.ok ? ((await r.json()).data || []).length : 0;
}
const out = [], drop = {};
const skip = (kind, why) => { (drop[kind] ??= {})[why] = (drop[kind][why] || 0) + 1; };
for (let tries = 0; out.length < COUNT && tries < 5000; tries++) {
  const d = rnd() * total, s = segs.find((x) => d < x.from + x.len), f = (d - s.from) / s.len;
  const c = await placeCut(s.a.lat + (s.b.lat - s.a.lat) * f, s.a.lon + (s.b.lon - s.a.lon) * f);
  const kind = KIND[s.w.tags.highway];
  if (!c || KIND[c.way.tags.highway] !== kind) { skip(kind, "snapped to another type"); continue; }
  if ([...out, ...OLD].some((o) => Math.hypot((o.lat - c.lat) * 110574, (o.lon - c.lon) * 88000) < 150)) { skip(kind, "near an old point"); continue; }
  if (!(await photoNear(c.lat, c.lon))) { skip(kind, "no photo"); continue; }
  out.push({ id: `sa-${out.length + 1}`, country: "US", town: "sanfrancisco", kind, name: c.way.tags.name || "", highway: c.way.tags.highway, wayId: c.way.id,
    lat: +c.lat.toFixed(7), lon: +c.lon.toFixed(7), bearing: +c.bearing.toFixed(1), variants: ["def", "sfold"] });
}
console.error("vynecháno", JSON.stringify(drop));
await fs.writeFile(path.join(HERE, "sample.json"), JSON.stringify(out, null, 1));
