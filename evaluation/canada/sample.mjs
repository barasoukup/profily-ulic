// Random cuts of Toronto (evaluation/canada): node evaluation/canada/sample.mjs dev 40 | fresh 60 | houses 60. The method of
// evaluation/usa/fresh/sample.mjs, whose code this is: the proportion of the network (a random point of the whole length),
// a fixed seed, none within 150 m of the development points (dev.json and TRIED), a Mapillary photo within 30 m.
import fs from "node:fs/promises";
import path from "node:path";
import { decodeTile, mergePieces } from "../../app/public/osmtile.js";
import { inside } from "../../app/public/places.js";
const ROOT = new URL("../usa-dc/", import.meta.url).pathname, DATA = new URL("data/", import.meta.url).pathname;
process.env.OSM_TILES = path.join(DATA, "osm-tiles");
const { placeCut } = await import("../usa-dc/lib.mjs");
const [WHAT, COUNT] = [process.argv[2], Number(process.argv[3])], SEEDS = { dev: 20261125, fresh: 20261201 };
const HERE = path.dirname(new URL(import.meta.url).pathname), read = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
const TRIED = [[43.65889, -79.41646], [43.6565, -79.453], [43.729, -79.264], [43.649, -79.396], [43.657, -79.4], [43.676, -79.42], [43.6488, -79.378], [43.6895, -79.297], [43.7615, -79.411], [43.638, -79.446],
  [43.6535, -79.3839]].map(([lat, lon]) => ({ lat, lon }));
const OLD = [...(WHAT === "dev" ? [] : await read("dev.json")), ...TRIED];
const DC = (await read("../../app/public/mesta-ca.json")).toronto;
const KIND = { motorway: "motorway", motorway_link: "motorway", trunk: "arterial", trunk_link: "arterial", primary: "arterial", primary_link: "arterial", secondary: "arterial", secondary_link: "arterial",
  tertiary: "collector", tertiary_link: "collector", residential: "local", unclassified: "local", living_street: "local", service: "service" };
const NOT = new Set(["driveway", "parking_aisle", "drive-through", "emergency_access"]);
let seed = SEEDS[WHAT];
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const tiles = await Promise.all((await fs.readdir(path.join(DATA, "osm-tiles"))).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).sort().map(async (f) => decodeTile(await fs.readFile(path.join(DATA, "osm-tiles", f), "utf8"))));
const ok = (el) => { const t = el.tags || {}; return el.type === "way" && KIND[t.highway] && !NOT.has(t.service) && !(t.tunnel && t.tunnel !== "no") && !(t.bridge && t.bridge !== "no") && t.area !== "yes" && t.covered !== "yes" && !(Number(t.layer) < 0) && !/private|no/.test(t.access || ""); };
const segs = [], byKind = {};
let total = 0;
for (const w of mergePieces(tiles).filter(ok).sort((a, b) => a.id - b.id)) for (let i = 1; i < w.geometry.length; i++) {
  const [a, b] = [w.geometry[i - 1], w.geometry[i]], len = Math.hypot((b.lon - a.lon) * 80500, (b.lat - a.lat) * 110574);
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
for (let tries = 0; out.length < COUNT && tries < 2000; tries++) {
  const d = rnd() * total, s = segs.find((x) => d < x.from + x.len), f = (d - s.from) / s.len;
  const c = await placeCut(s.a.lat + (s.b.lat - s.a.lat) * f, s.a.lon + (s.b.lon - s.a.lon) * f);
  const kind = KIND[s.w.tags.highway];
  if (!c || KIND[c.way.tags.highway] !== kind) { skip(kind, "snapped to another type"); continue; }
  if ([...out, ...OLD].some((o) => Math.hypot((o.lat - c.lat) * 110574, (o.lon - c.lon) * 80500) < 150)) { skip(kind, "near an old point"); continue; }
  if (!(await photoNear(c.lat, c.lon))) { skip(kind, "no photo"); continue; }
  out.push({ id: `${WHAT[0] === "d" ? "d" : "t"}-${out.length + 1}`, country: "CA", town: "toronto", kind, name: c.way.tags.name || "", highway: c.way.tags.highway, wayId: c.way.id,
    lat: +c.lat.toFixed(7), lon: +c.lon.toFixed(7), bearing: +c.bearing.toFixed(1), variants: ["def", "map0"] });
}
console.error("vynecháno", JSON.stringify(drop));
await fs.writeFile(path.join(HERE, `${WHAT}.json`), JSON.stringify(out, null, 1));
