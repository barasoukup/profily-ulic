// The open data around each cut of the width check (REPORT.md here), asked once and kept in ../data/width-cache (git
// ignores it): DataSF Sidewalk Widths (4g86-grxu, AECOM 2014, PDDL) within 60 m, and for the shift of the footprints the
// same layers the app's map reads (towns/sanfrancisco.js): Right of Way Polygons (h8n7-e4ns) and Building Footprints
// (ynuv-fyni) in a box of ±90 m. One request at a time, 0.5 s apart.   node evaluation/usa/sf/width/fetch.mjs
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
const HERE = path.dirname(new URL(import.meta.url).pathname), CACHE = path.join(HERE, "../data/width-cache");
await fs.mkdir(CACHE, { recursive: true });
const read = async (f) => JSON.parse(await fs.readFile(path.join(HERE, f), "utf8"));
export async function cached(url) {
  const f = path.join(CACHE, crypto.createHash("sha1").update(url).digest("hex") + ".json");
  try { return JSON.parse(await fs.readFile(f, "utf8")); } catch {}
  await new Promise((r) => setTimeout(r, 500));
  const r = await fetch(url, { headers: { "User-Agent": "profily-ulic" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const j = await r.json();
  await fs.writeFile(f, JSON.stringify(j));
  return j;
}
export const sidewalksUrl = (p) => `https://data.sf.gov/resource/4g86-grxu.json?${new URLSearchParams({ $where: `within_circle(shape, ${p.lat}, ${p.lon}, 60)`, $limit: "200" })}`;
const box = (p, m = 90) => { const dx = m / (111320 * Math.cos((p.lat * Math.PI) / 180)), dy = m / 110574; const [x0, y0, x1, y1] = [p.lon - dx, p.lat - dy, p.lon + dx, p.lat + dy]; return `POLYGON((${x0} ${y0},${x1} ${y0},${x1} ${y1},${x0} ${y1},${x0} ${y0}))`; };
export const rowUrl = (p) => `https://data.sf.gov/resource/h8n7-e4ns.geojson?${new URLSearchParams({ $where: `intersects(the_geom,'${box(p)}')`, $limit: "2000" })}`;
export const bldgUrl = (p) => `https://data.sf.gov/resource/ynuv-fyni.geojson?${new URLSearchParams({ $where: `intersects(shape,'${box(p)}')`, $limit: "2000" })}`;
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const pts = [...await read("../fresh.json"), ...await read("../fixes/sample.json"), ...await read("new.json")];
  let n = 0;
  for (const p of pts) {
    for (const u of [sidewalksUrl(p), rowUrl(p), bldgUrl(p)]) { try { await cached(u); } catch (e) { console.error(p.id, e.message.slice(0, 120)); } }
    if (++n % 20 === 0) console.error(n, "/", pts.length);
  }
}
