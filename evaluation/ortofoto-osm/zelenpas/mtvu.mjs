// The green strip beyond the kerb (ortho-osm.js trimToEnds, P.greenStripOn; Bára 23. 11. 2026) against MTVU: for the
// regression's cuts of Prague and Brno, the profile with and without it; what MTVU has on the metres the strip adds.
//   W=3 node evaluation/ortofoto-osm/zelenpas/mtvu.mjs   (W: the strip's width, m)
import { cuts, truthOf, osmAround, stripOf } from "../lib.mjs";
import { orthoOsmPolys, trimToEnds, P } from "../../../pilot/public/ortho-osm.js";
import { localFrame, deriveProfile } from "../../../pilot/public/derive.js";
const runKind = (c) => (c === 700 || c === 701 || (c >= 9700 && c < 9800 && !(c >= 9704 && c <= 9708)) ? "vozovka" : c === 704 || (c >= 9704 && c <= 9708) ? "stání" : c === 702 || c === 703 ? "chodník" : c >= 400 && c < 500 ? "zeleň" : c === 705 ? "vozovka" : c===601?"budova":"jiné"+c);
const laid = (p) => { const out = []; let t = p.extent[1]; for (const s of p.segments) { out.push({ type: s.type, s: t - s.width, e: t }); t -= s.width; } return out; };
const tally = {}; let sides = 0, cutsN = 0;
for (const city of ["praha", "brno"]) for (const key of city === "praha" ? ["cuzk12", "ipr10"] : ["cuzk12", "brno10"]) for (const c of await cuts(city)) {
  const st = await stripOf(city, key, c); if (!st) continue;
  const osm = { elements: await osmAround(c.cut.lat, c.cut.lon, 70) };
  const frame = localFrame(c.cut.lat, c.cut.lon), b = (c.cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)];
  const way = osm.elements.find((e) => e.type === "way" && e.id === c.cut.wayId); if (!way) continue;
  const prof = (off) => { P.off = new Set(); P.greenStripOn = !off; P.greenStrip = Number(process.env.W || 3); const polys = orthoOsmPolys({ osm, frame, dir, way, st }); if (!polys) return null; return trimToEnds(deriveProfile({ center: [0, 0], dir, half: 40, polys, osm, frame, way, reach: { left: 40, right: 40 } }), polys.ends); };
  const on = prof(false), off = prof(true);
  if (!on?.extent || !off?.extent) continue;
  const add = [[on.extent[0], off.extent[0]], [off.extent[1], on.extent[1]]].filter(([a, b2]) => b2 - a > 0.05);
  if (!add.length) continue; cutsN++; sides += add.length;
  for (const [a, b2] of add) for (let t = a + 0.05; t < b2; t += 0.1) { const r = c.a.runs.find((q) => q.s <= t && t < q.e); const k = r ? runKind(r.code) : "mimo"; tally[key+" "+k] = (tally[key+" "+k] || 0) + 0.1; }
}
console.log(cutsN, sides, Object.fromEntries(Object.entries(tally).map(([k, v]) => [k, +v.toFixed(1)])));
