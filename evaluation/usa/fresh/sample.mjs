// The fresh measurement of DC's map after the hostile review (25. 11. 2026; REPORT.md here): 60 random cuts of
// Washington's streets in the proportion of the network (a random point of the whole length, so each type as often as it
// is long; a fixed seed), none within 150 m of any point used before in evaluation/usa* or tried while the review's
// findings were fixed, each with a Mapillary photo within 30 m. No tunnels, bridges nor covered ways; of service roads
// not driveways, parking aisles and drive-throughs (the universal measurement leaves them out). Writes sample.json.
//   node evaluation/usa/fresh/sample.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { decodeTile, mergePieces } from "../../../app/public/osmtile.js";
import { inside } from "../../../app/public/places.js";
import { ROOT, DATA, placeCut } from "../../usa-dc/lib.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname), read = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
const TRIED = [[38.895285, -77.029047], [38.8946, -77.0268], [38.96509, -77.00168], [38.91404, -77.03268], [38.8436094, -76.9725878], [38.96689, -77.07792],
  [38.9125, -77.0215], [38.93, -77.0365], [38.8977, -77.0365]].map(([lat, lon]) => ({ lat, lon }));
const OLD = [...await read("../../usa-dc/sample.json"), ...await read("../ab/sample.json"), ...await read("../arterials/sample.json"), ...TRIED];
const DC = (await read("../../../app/public/towns-us.json")).washington;
const KIND = { motorway: "motorway", motorway_link: "motorway", trunk: "arterial", trunk_link: "arterial", primary: "arterial", primary_link: "arterial", secondary: "arterial", secondary_link: "arterial",
  tertiary: "collector", tertiary_link: "collector", residential: "local", unclassified: "local", living_street: "local", service: "service" };
const NOT = new Set(["driveway", "parking_aisle", "drive-through", "emergency_access"]);
let seed = 20261126;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const tiles = await Promise.all((await fs.readdir(path.join(DATA, "osm-tiles"))).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).sort().map(async (f) => decodeTile(await fs.readFile(path.join(DATA, "osm-tiles", f), "utf8"))));
const ok = (el) => { const t = el.tags || {}; return el.type === "way" && KIND[t.highway] && !NOT.has(t.service) && !(t.tunnel && t.tunnel !== "no") && !(t.bridge && t.bridge !== "no") && t.area !== "yes" && t.covered !== "yes" && !(Number(t.layer) < 0) && !/private|no/.test(t.access || ""); };
const segs = [], byKind = {};
let total = 0;
for (const w of mergePieces(tiles).filter(ok).sort((a, b) => a.id - b.id)) for (let i = 1; i < w.geometry.length; i++) {
  const [a, b] = [w.geometry[i - 1], w.geometry[i]], len = Math.hypot((b.lon - a.lon) * 86700, (b.lat - a.lat) * 110574);
  if (!len || !inside(DC, (a.lon + b.lon) / 2, (a.lat + b.lat) / 2)) continue;
  segs.push({ a, b, from: total, len, w }); total += len;
  byKind[KIND[w.tags.highway]] = (byKind[KIND[w.tags.highway]] || 0) + len;
}
for (const [k, v] of Object.entries(byKind)) console.error(k, (v / 1000).toFixed(0), "km", ((100 * v) / total).toFixed(0), "%");
const TOKEN = (await fs.readFile(path.join(ROOT, "..", "streetview", "token.local"), "utf8").catch(() => fs.readFile("/Users/barasoukupova/streetdesign/.claude/worktrees/france/evaluation/streetview/token.local", "utf8"))).trim();
async function photoNear(lat, lon) {
  await new Promise((r) => setTimeout(r, 300));
  const r = await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat, lng: lon, radius: 30, limit: 5, fields: "id" })}`);
  return r.ok ? ((await r.json()).data || []).length : 0;
}
const out = [], drop = {};
const skip = (kind, why) => { (drop[kind] ??= {})[why] = (drop[kind][why] || 0) + 1; };
for (let tries = 0; out.length < 60 && tries < 2000; tries++) {
  const d = rnd() * total, s = segs.find((x) => d < x.from + x.len), f = (d - s.from) / s.len;
  const c = await placeCut(s.a.lat + (s.b.lat - s.a.lat) * f, s.a.lon + (s.b.lon - s.a.lon) * f);
  const kind = KIND[s.w.tags.highway];
  if (!c || KIND[c.way.tags.highway] !== kind) { skip(kind, "snapped to another type"); continue; }
  if ([...out, ...OLD].some((o) => Math.hypot((o.lat - c.lat) * 110574, (o.lon - c.lon) * 86700) < 150)) { skip(kind, "near an old point"); continue; }
  if (!(await photoNear(c.lat, c.lon))) { skip(kind, "no photo"); continue; }
  out.push({ id: `f-${out.length + 1}`, country: "US", town: "washington", kind, name: c.way.tags.name || "", highway: c.way.tags.highway, wayId: c.way.id,
    lat: +c.lat.toFixed(7), lon: +c.lon.toFixed(7), bearing: +c.bearing.toFixed(1), variants: ["def", "dc0"] });
}
console.error("vynecháno", JSON.stringify(drop));
await fs.writeFile(path.join(HERE, "sample.json"), JSON.stringify(out, null, 1));
