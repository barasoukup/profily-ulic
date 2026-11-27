// New York unchanged (the hostile review of 26. 11. 2026, the optional layers Plaza and Parking Lot): the 50 cuts of the measurement
// (evaluation/usa/nyc/sample.json) through the surfaces of usa.js sources (NYC_MAP), with the answers of NYCmaps kept in
// data/cache (asked once, 1.2 s apart). Prints a hash of each answer; run before and after, the outputs must be equal.
//   SITE=http://localhost:5461 node evaluation/usa/nyc/same.mjs > before.txt   (the local server with the pack us_nyc)
import fs from "node:fs/promises";
import crypto from "node:crypto";
const SITE = process.env.SITE, CACHE = new URL("data/cache/", import.meta.url);
globalThis.location = { search: "?osm=balik", href: SITE, origin: SITE };
await fs.mkdir(CACHE, { recursive: true });
const native = globalThis.fetch, sha = (s) => crypto.createHash("sha1").update(s).digest("hex");
let last = 0;
globalThis.fetch = async (url, o) => {
  url = String(url?.url || url);
  if (!/^https?:/.test(url)) return native(new URL(url, SITE + "/"), o);
  const f = new URL(sha(url) + ".json", CACHE);
  try { return new Response(await fs.readFile(f), { headers: { "content-type": "application/json" } }); } catch {}
  last = Math.max(last + 1200, Date.now());
  await new Promise((r) => setTimeout(r, last - Date.now()));
  const r = await native(url, { headers: { "User-Agent": "profily-ulic evaluation" } });
  const t = await r.text();
  if (r.ok && !/^\s*\{"error"/.test(t)) await fs.writeFile(f, t);
  return new Response(t, { status: r.status });
};
const C = await import("../../../app/public/city.js"), json = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
C.loadBounds(await json("../../../app/public/towns.json")); await import("../../../app/public/america.js"); C.loadStates({ ...await json("../../../app/public/states.json"), ...await json("../../../app/public/states-america.json") }); C.loadTowns(await json("../../../app/public/towns-us.json"));
const U = await import("../../../app/public/towns/usa.js");
for (const s of await json("sample.json")) {
  const b = (s.bearing * Math.PI) / 180, half = 40, pad = 0.0004, kx = 111320 * Math.cos((s.lat * Math.PI) / 180);
  const dx = (Math.abs(Math.cos(b)) * half) / kx + pad, dy = (Math.abs(Math.sin(b)) * half) / 110574 + pad;
  const bbox = [s.lon - dx, s.lat - dy, s.lon + dx, s.lat + dy].map((v) => v.toFixed(6)).join(",");
  const o = await U.sources.osm(s.lat, s.lon, 80), way = o.elements.find((e) => e.id === s.wayId);
  const m = await U.sources.surfaces(bbox, way?.tags, way), l = await U.sources.lines(bbox);
  const { usTown, cityMap, ...rest } = m;
  if (rest.mapFailed) console.error(s.id, "mapFailed");
  console.log(s.id, !!(usTown || cityMap), rest.features.length, sha(JSON.stringify(rest)), l.features.length, sha(JSON.stringify(l)), o.elements.filter((e) => e.type === "area" && e.id < 0).length, sha(JSON.stringify(o)));
}
