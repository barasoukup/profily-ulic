// Which cuts does the DDOT fit (?off=ddotfit) change?  Bára 27. 11. 2026.
//   SITE=http://localhost:5473 [OFF=ddotfit] node evaluation/usa/ddot-fit/affected.mjs > out-<on|off>.jsonl
// All Washington cuts of the samples (usa/ab, usa/fresh, usa/arterials, canada/review, canada/fresh, canada/dev), the services'
// answers kept in evaluation/canada/data/cache (asked once, 1.2 s apart, as dc-same.mjs). One line a cut: id, a hash of the
// surfaces, the parking strips and roadway runs, noParkGuess. Compare the runs with and without OFF.
import fs from "node:fs/promises";
import crypto from "node:crypto";
const SITE = process.env.SITE, CACHE = new URL("../../canada/data/cache/", import.meta.url);
globalThis.location = { search: "?osm=balik" + (process.env.OFF ? "&off=" + process.env.OFF : ""), href: SITE, origin: SITE };
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
const json = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
const C = await import("../../../app/public/city.js");
C.loadBounds(await json("../../../app/public/mesta.json")); await import("../../../app/public/america.js");
C.loadStates({ ...await json("../../../app/public/staty.json"), ...await json("../../../app/public/staty-america.json") }); C.loadTowns(await json("../../../app/public/mesta-us.json"));
const U = await import("../../../app/public/towns/usa.js");
const files = process.env.SAMPLES ? process.env.SAMPLES.split(",") : ["../ab/sample.json", "../fresh/sample.json", "../arterials/sample.json", "../../canada/review/sample.json", "../../canada/fresh.json", "../../canada/dev.json"];
const seen = new Set(), [x0, y0, x1, y1] = U.AREAS.dc.box;
for (const f of files) {
  let list; try { list = await json(f); } catch { continue; }
  if (!Array.isArray(list)) list = list.cuts || list.items || Object.values(list);
  for (const s of list) {
    if (!s || typeof s.lat !== "number" || s.lat < y0 || s.lat > y1 || s.lon < x0 || s.lon > x1 || seen.has(s.id)) continue;
    seen.add(s.id);
    const b = (s.bearing * Math.PI) / 180, half = 40, pad = 0.0004, kx = 111320 * Math.cos((s.lat * Math.PI) / 180);
    const dx = (Math.abs(Math.cos(b)) * half) / kx + pad, dy = (Math.abs(Math.sin(b)) * half) / 110574 + pad;
    const bbox = [s.lon - dx, s.lat - dy, s.lon + dx, s.lat + dy].map((v) => v.toFixed(6)).join(",");
    try {
      const o = await U.sources.osm(s.lat, s.lon, 80), way = o.elements.find((e) => e.id === s.wayId);
      const m = await U.sources.surfaces(bbox, way?.tags, way);
      const park = (m?.features || []).filter((q) => q.attributes?.code === 704).length;
      console.log(JSON.stringify({ id: s.id, src: f.replace(/.*\/(\w+)\/(\w+)\.json/, "$1/$2"), kind: s.kind, name: s.name, park, ng: !!m?.noParkGuess, ddot: !!m?.usDdot, h: sha(JSON.stringify(m?.features || null)), wt: m?.wayTags || null }));
    } catch (e) { console.log(JSON.stringify({ id: s.id, err: String(e).slice(0, 80) })); }
  }
}
process.exit(0);
