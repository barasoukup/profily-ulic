// New cuts of San Francisco for the width check (26. 11. 2026, ZPRAVA.md here): the method of ../sample.mjs (a random
// point of the network's whole length, placed as a click places it), seed 20261127, only streets with sidewalks to
// compare (local, collector, arterial; no service roads, no motorways), none within 150 m of the cuts of the earlier SF
// measurements (../fresh.json, ../fixes/sample.json, ../curb/fresh.json) or of each other. No photo needed (no judge).
//   node evaluation/usa/sf/width/sample.mjs 40   → new.json
import fs from "node:fs/promises";
import path from "node:path";
import { decodeTile, mergePieces } from "../../../../pilot/public/osmtile.js";
import { inside } from "../../../../pilot/public/places.js";
const DATA = new URL("../data/", import.meta.url).pathname, HERE = path.dirname(new URL(import.meta.url).pathname);
process.env.OSM_TILES = path.join(DATA, "osm-tiles");
const { placeCut } = await import("../../../usa-dc/lib.mjs");
const COUNT = Number(process.argv[2] || 40);
const read = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
const OLD = [...await read("../fresh.json"), ...await read("../fixes/sample.json"), ...await read("../curb/fresh.json").catch(() => [])];
const SF = (await read("../../../../pilot/public/mesta-us.json")).sanfrancisco;
const KIND = { trunk: "arterial", primary: "arterial", secondary: "arterial", tertiary: "collector", residential: "local", unclassified: "local", living_street: "local" };
let seed = 20261127;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const tiles = await Promise.all((await fs.readdir(path.join(DATA, "osm-tiles"))).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).sort().map(async (f) => decodeTile(await fs.readFile(path.join(DATA, "osm-tiles", f), "utf8"))));
const ok = (el) => { const t = el.tags || {}; return el.type === "way" && KIND[t.highway] && !(t.tunnel && t.tunnel !== "no") && !(t.bridge && t.bridge !== "no") && t.area !== "yes" && t.covered !== "yes" && !(Number(t.layer) < 0) && !/private|no/.test(t.access || ""); };
const segs = [];
let total = 0;
for (const w of mergePieces(tiles).filter(ok).sort((a, b) => a.id - b.id)) for (let i = 1; i < w.geometry.length; i++) {
  const [a, b] = [w.geometry[i - 1], w.geometry[i]], len = Math.hypot((b.lon - a.lon) * 88000, (b.lat - a.lat) * 110574);
  if (!len || !inside(SF, (a.lon + b.lon) / 2, (a.lat + b.lat) / 2)) continue;
  segs.push({ a, b, from: total, len, w }); total += len;
}
const out = [], drop = {};
for (let tries = 0; out.length < COUNT && tries < 3000; tries++) {
  const d = rnd() * total, s = segs.find((x) => d < x.from + x.len), f = (d - s.from) / s.len;
  const c = await placeCut(s.a.lat + (s.b.lat - s.a.lat) * f, s.a.lon + (s.b.lon - s.a.lon) * f);
  const kind = KIND[s.w.tags.highway];
  if (!c || KIND[c.way.tags.highway] !== kind) { drop.snapped = (drop.snapped || 0) + 1; continue; }
  const near = Math.min(...OLD.map((o) => Math.hypot((o.lat - c.lat) * 110574, (o.lon - c.lon) * 88000)));
  if (near < 150 || out.some((o) => Math.hypot((o.lat - c.lat) * 110574, (o.lon - c.lon) * 88000) < 150)) { drop.near = (drop.near || 0) + 1; continue; }
  out.push({ id: `n-${out.length + 1}`, country: "US", town: "sanfrancisco", kind, name: c.way.tags.name || "", highway: c.way.tags.highway, wayId: c.way.id,
    lat: +c.lat.toFixed(7), lon: +c.lon.toFixed(7), bearing: +c.bearing.toFixed(1), oldDist: Math.round(near) });
}
console.error("vynecháno", JSON.stringify(drop), "bodů", out.length);
await fs.writeFile(path.join(HERE, "new.json"), JSON.stringify(out, null, 1));
