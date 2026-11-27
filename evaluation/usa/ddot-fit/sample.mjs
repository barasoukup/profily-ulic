// New Washington cuts for the DDOT fit (Bára 27. 11. 2026): a random draw (seed 27) of DDOT's inventory lines with two or more
// parking lanes, narrow-ish carriageways first (travel + parking lane width <= 11 m), one cut at the line's middle, on the nearest
// street of OSM (road kinds a click would pick); lines within 40 m of a cut of the earlier samples left out.  Asks DDOT politely
// (2 s apart, cached by hand: the output is the cache). Writes sample-new.json.   SITE=http://localhost:5473 node sample.mjs
import fs from "node:fs/promises";
const SITE = process.env.SITE, OUT = new URL("sample-new.json", import.meta.url);
globalThis.location = { search: "?osm=balik", href: SITE, origin: SITE };
const native = globalThis.fetch;
globalThis.fetch = async (url, o) => { url = String(url?.url || url); return /^https?:/.test(url) ? native(url, o) : native(new URL(url, SITE + "/"), o); };
const json = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
const C = await import("../../../pilot/public/city.js");
C.loadBounds(await json("../../../pilot/public/mesta.json")); await import("../../../pilot/public/america.js");
C.loadStates({ ...await json("../../../pilot/public/staty.json"), ...await json("../../../pilot/public/staty-america.json") }); C.loadTowns(await json("../../../pilot/public/mesta-us.json"));
const U = await import("../../../pilot/public/towns/usa.js");
const B = U.DC_SUBBLOCK, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ask = async (p) => { await sleep(2000); const r = await native(`${B}/query?${new URLSearchParams({ f: "json", ...p })}`, { headers: { "User-Agent": "profily-ulic evaluation" } }); return r.json(); };
const ids = (await ask({ where: "TOTALPARKINGLANES>=2 AND (TOTALTRAVELLANEWIDTH+TOTALPARKINGLANEWIDTH)<=36", returnIdsOnly: "true" })).objectIds;
console.error("candidates", ids.length);
let seed = 27; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = ids.map((id) => [rnd(), id]).sort((a, b) => a[0] - b[0]).slice(0, 260).map((x) => x[1]);
const old = []; for (const f of ["../ab/sample.json", "../fresh/sample.json", "../arterials/sample.json", "../../canada/review/sample.json"]) old.push(...await json(f));
const out = [];
for (let i = 0; i < pick.length && out.length < 150; i += 40) {
  const j = await ask({ objectIds: pick.slice(i, i + 40).join(","), outFields: "OBJECTID,ROADTYPE,STREETNAME,TOTALTRAVELLANES,TOTALPARKINGLANES,TOTALTRAVELLANEWIDTH,TOTALPARKINGLANEWIDTH", returnGeometry: "true", outSR: "4326" });
  for (const f of j.features || []) {
    const p = f.geometry.paths[0], m = Math.floor(p.length / 2), [lon, lat] = p.length % 2 ? p[m] : [(p[m][0] + p[m - 1][0]) / 2, (p[m][1] + p[m - 1][1]) / 2];
    const kx = 111320 * Math.cos((lat * Math.PI) / 180);
    if (old.some((s) => Math.hypot((s.lon - lon) * kx, (s.lat - lat) * 110574) < 40) || out.some((s) => Math.hypot((s.lon - lon) * kx, (s.lat - lat) * 110574) < 60)) continue;
    const o = await U.sources.osm(lat, lon, 60);
    let best = null;
    for (const e of o.elements) {
      if (e.type !== "way" || !e.geometry || !/^(residential|tertiary|secondary|primary|unclassified|service|living_street|trunk)$/.test(e.tags?.highway || "")) continue;
      for (let k = 1; k < e.geometry.length; k++) {
        const a = e.geometry[k - 1], b = e.geometry[k], ax = (a.lon - lon) * kx, ay = (a.lat - lat) * 110574, bx = (b.lon - lon) * kx, by = (b.lat - lat) * 110574;
        const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1))), d = Math.hypot(ax + t * dx, ay + t * dy);
        if (!best || d < best.d) best = { d, e, bearing: (Math.atan2(dx, dy) * 180) / Math.PI };
      }
    }
    if (!best || best.d > 12) continue;
    out.push({ id: `df-${out.length + 1}`, country: "US", town: "washington", kind: best.e.tags.highway, name: best.e.tags.name || "", highway: best.e.tags.highway, wayId: best.e.id, lat: +lat.toFixed(7), lon: +lon.toFixed(7), bearing: +best.bearing.toFixed(1), inv: { oid: f.attributes.OBJECTID, park: f.attributes.TOTALPARKINGLANES, lanes: f.attributes.TOTALTRAVELLANES, w: f.attributes.TOTALTRAVELLANEWIDTH + f.attributes.TOTALPARKINGLANEWIDTH } });
  }
  console.error(i, out.length);
}
await fs.writeFile(OUT, JSON.stringify(out, null, 1));
process.exit(0);
