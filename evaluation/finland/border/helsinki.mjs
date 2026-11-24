// Helsinki's border for towns/finland.js (the review of 24. 11. 2026, bod 7: the box took parts of Espoo and Vantaa):
// the city's 60 districts with their waters (kartta.hel.fi WFS avoindata:Kaupunginosajako, CC BY 4.0 Helsingin
// kaupunki), merged into the city's outline (the districts share their vertices: an edge two districts have goes) and
// simplified to TOL m. Writes pilot/public/towns/finland-helsinki.js.
//   node evaluation/finland/border/helsinki.mjs [cached.json]
import fs from "node:fs";
const TOL = 5;
const URL_WFS = "https://kartta.hel.fi/ws/geoserver/avoindata/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=avoindata:Kaupunginosajako&outputFormat=application/json&srsName=EPSG:4326&propertyName=nimi_fi,geom";
const d = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], "utf8")) : await (await fetch(URL_WFS, { headers: { "User-Agent": "profily-ulic" } })).json();
const key = (p) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`;
const edges = new Map();
for (const f of d.features) {
  const polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
  for (const poly of polys) for (const r of poly) for (let i = 0; i + 1 < r.length; i++) {
    const a = key(r[i]), b = key(r[i + 1]);
    if (a === b) continue;
    const back = `${b}|${a}`, fwd = `${a}|${b}`;
    if (edges.has(back)) edges.delete(back); else if (edges.has(fwd)) edges.delete(fwd); else edges.set(fwd, [r[i], r[i + 1]]);
  }
}
// Chain the edges left into rings.
const from = new Map();
for (const [k, e] of edges) { const a = key(e[0]); if (!from.has(a)) from.set(a, []); from.get(a).push(k); }
const rings = [];
while (edges.size) {
  const [k0, e0] = edges.entries().next().value;
  edges.delete(k0); from.get(key(e0[0])).splice(from.get(key(e0[0])).indexOf(k0), 1);
  const ring = [e0[0], e0[1]];
  for (;;) {
    const last = key(ring.at(-1));
    if (last === key(ring[0])) break;
    const next = from.get(last)?.pop();
    if (!next) break;
    ring.push(edges.get(next)[1]);
    edges.delete(next);
  }
  if (ring.length >= 4) rings.push(ring);
}
// Douglas–Peucker in metres.
const lat0 = 60.2, mx = 111320 * Math.cos((lat0 * Math.PI) / 180), my = 110574;
function dp(pts) {
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [i, j] = st.pop();
    const [ax, ay] = [pts[i][0] * mx, pts[i][1] * my], [bx, by] = [pts[j][0] * mx, pts[j][1] * my];
    let best = -1, bi = -1;
    for (let k = i + 1; k < j; k++) {
      const [px, py] = [pts[k][0] * mx, pts[k][1] * my], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
      const u = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0;
      const dd = Math.hypot(px - ax - u * dx, py - ay - u * dy);
      if (dd > best) { best = dd; bi = k; }
    }
    if (best > TOL) { keep[bi] = 1; st.push([i, bi], [bi, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}
const out = rings.map((r) => dp(r.slice(0, -1).concat([r[0]]))).filter((r) => r.length >= 4).map((r) => r.map(([x, y]) => [+x.toFixed(6), +y.toFixed(6)]));
const n = out.reduce((a, r) => a + r.length, 0);
fs.writeFileSync(new URL("../../../pilot/public/towns/finland-helsinki.js", import.meta.url),
  `// Helsinki's border with its waters (evaluation/finland/border/helsinki.mjs: the city's districts, kartta.hel.fi WFS\n// avoindata:Kaupunginosajako, CC BY 4.0 Helsingin kaupunki, merged and simplified to ${TOL} m; ${out.length} rings, ${n} points).\nexport const HELSINKI_RINGS = ${JSON.stringify(out)};\n`);
console.log(rings.length, "rings", out.length, "kept", n, "points");
