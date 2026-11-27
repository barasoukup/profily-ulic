// The Slovenian sample of the centre-line A/B (REPORT.md): N points on two-way streets of the larger towns, a fixed seed,
// the classes mixed (primary, secondary, tertiary, residential: the law's strip needs a wide roadway). The street, its
// bearing and the width are the app's (a click at the point). OSM: the local extract (data/osm/si, tools/build_osm_data.sh).
//   node evaluation/centre-line/sample.mjs [N=150] > evaluation/centre-line/si-sample.json
//   WIDE=1 SEED=20261128 node evaluation/centre-line/sample.mjs 200 > evaluation/centre-line/si-sample2.json   (more primary and secondary roads; the points of si-sample.json left out)
import fs from "node:fs";

const OSM = process.env.OSM || "/Users/barasoukupova/streetdesign/data/osm/si/si_ways.geojsonl";
const N = +(process.argv[2] || 150);
let seed = +(process.env.SEED || 20261127);
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TOWNS = { ljubljana: [46.0514, 14.5058, 3.2], maribor: [46.558, 15.646, 2.5], celje: [46.2364, 15.2677, 1.5], kranj: [46.2389, 14.3556, 1.5], koper: [45.5481, 13.7302, 1.5], "novo mesto": [45.8039, 15.1689, 1.5] };
const WANT = process.env.WIDE ? { primary: 0.3, secondary: 0.45, tertiary: 0.25 } : { primary: 0.12, secondary: 0.3, tertiary: 0.38, residential: 0.2 };
const used = new Set(process.env.WIDE ? JSON.parse(fs.readFileSync(new URL("./si-sample.json", import.meta.url), "utf8")).map((p) => `${p.lat},${p.lon}`) : []);
const tagsOf = (p) => { const t = { ...p }; for (const m of String(p.other_tags || "").matchAll(/"([^"]+)"=>"((?:[^"\\]|\\.)*)"/g)) t[m[1]] = m[2]; return t; };
const cand = {};
for (const line of fs.readFileSync(OSM, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const f = JSON.parse(line.replace(/^\x1e/, "")), g = f.geometry;
  if (g?.type !== "LineString") continue;
  const t = tagsOf(f.properties || {});
  if (!WANT[t.highway] || t.oneway === "yes" || t.junction || t.bridge || t.tunnel || t.railway || t.layer) continue;
  const c = g.coordinates, mid = c[c.length >> 1];
  let len = 0;
  for (let i = 1; i < c.length; i++) len += Math.hypot((c[i][0] - c[i - 1][0]) * 77000, (c[i][1] - c[i - 1][1]) * 111000);
  if (len < 50) continue;
  if (used.has(`${+mid[1].toFixed(6)},${+mid[0].toFixed(6)}`)) continue;
  for (const [town, [lat, lon, r]] of Object.entries(TOWNS)) if (Math.hypot((mid[0] - lon) * 77, (mid[1] - lat) * 111) <= r) (cand[t.highway] ??= []).push({ town, lat: +mid[1].toFixed(6), lon: +mid[0].toFixed(6), name: t.name || "", highway: t.highway, lanes: t.lanes || "" });
}
const out = [];
for (const [hw, share] of Object.entries(WANT)) {
  const list = cand[hw] || [], k = Math.round(N * share);
  for (let i = 0; i < k && list.length; i++) out.push(list.splice(Math.floor(rnd() * list.length), 1)[0]);
}
const rows = out.map((p, i) => ({ id: i + 1, country: "SI", ...p }));
console.log("[" + rows.map((p) => JSON.stringify(p)).join(",\n") + "]");
