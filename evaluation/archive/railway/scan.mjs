// Offline search (no browser, no query) for the cuts a railway can touch (Bára 27. 11. 2026): the named streets of the
// town boxes (the geojsonl of build.sh) with a track of rail, light_rail, narrow_gauge or subway at ground level running
// along them 4–22 m from the street's line for at least 30 m; and controls: streets with no railway or tram within 100 m.
// Writes the cuts as the app reads a click (lat, lon of the street's point, bearing along the street).
//   node evaluation/archive/railway/scan.mjs <data dir> <ISO> > cand-<ISO>.json
import fs from "node:fs";
import readline from "node:readline";
const [dir, ISO] = process.argv.slice(2);
const STREETS = new Set(["residential", "living_street", "tertiary", "secondary", "primary", "trunk", "unclassified"]);
const RAIL = new Set(["rail", "light_rail", "narrow_gauge", "subway"]);
const tag = (s, k) => (s.match(new RegExp(`"${k}"=>"([^"]*)"`)) || [])[1];
let seed = 20261127;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const out = { cand: [], control: [] };
for (const f of fs.readdirSync(dir).filter((f) => f.startsWith(ISO.toLowerCase() + "-") && f.endsWith("_ways.geojsonl"))) {
  const town = f.slice(ISO.length + 1, -"_ways.geojsonl".length);
  const streets = [], rails = [], trams = [];
  for await (const line of readline.createInterface({ input: fs.createReadStream(`${dir}/${f}`) })) {
    const ft = JSON.parse(line), p = ft.properties, g = ft.geometry;
    if (g.type !== "LineString") continue;
    const ot = p.other_tags || "";
    if (p.highway && STREETS.has(p.highway) && p.name && !tag(ot, "tunnel") && !tag(ot, "bridge") && !(Number(tag(ot, "layer")) < 0)) streets.push({ id: p.osm_id, name: p.name, hw: p.highway, c: g.coordinates });
    else if (RAIL.has(p.railway) && !p.highway && !(tag(ot, "tunnel") && tag(ot, "tunnel") !== "no") && !(Number(tag(ot, "layer")) < 0)) rails.push({ id: p.osm_id, c: g.coordinates, rw: p.railway });
    else if (p.railway === "tram") trams.push({ c: g.coordinates });
  }
  if (!streets.length) continue;
  const lat0 = streets[0].c[0][1], kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110574;
  const m = (c) => c.map(([x, y]) => [x * kx, y * ky]);
  const R = rails.map((r) => ({ ...r, m: m(r.c) })), T = trams.map((r) => ({ m: m(r.c) }));
  // distance of a point to the nearest segment of a list of lines and the angle (deg) between the segment and a direction
  const near = (list, [px, py], dir, max) => {
    let best = null;
    for (const r of list) for (let i = 0; i + 1 < r.m.length; i++) {
      const [ax, ay] = r.m[i], [bx, by] = r.m[i + 1];
      if (Math.min(ax, bx) - max > px || Math.max(ax, bx) + max < px || Math.min(ay, by) - max > py || Math.max(ay, by) + max < py) continue;
      const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2));
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d < max && (!best || d < best.d)) {
        const ang = dir ? (Math.acos(Math.min(1, Math.abs((dx * dir[0] + dy * dir[1]) / (Math.sqrt(L2) || 1)))) * 180) / Math.PI : 0;
        best = { d, ang, id: r.id, side: (dx * (py - ay) - dy * (px - ax)) > 0 ? "L" : "R", rw: r.rw };
      }
    }
    return best;
  };
  for (const s of streets) {
    const M = m(s.c), pts = [];
    for (let i = 0; i + 1 < M.length; i++) {
      const [ax, ay] = M[i], [bx, by] = M[i + 1], L = Math.hypot(bx - ax, by - ay);
      if (L < 1) continue;
      const dir = [(bx - ax) / L, (by - ay) / L];
      for (let u = 5; u < L; u += 10) pts.push({ p: [ax + dir[0] * u, ay + dir[1] * u], dir });
    }
    let run = [];
    const flush = () => {
      if (run.length >= 3) { const q = run[run.length >> 1]; out.cand.push({ id: `${ISO}-${town}-${s.id}-${run.length}`, country: ISO, town, way: s.id, name: s.name, hw: s.hw, lat: +(q.p[1] / ky).toFixed(6), lon: +(q.p[0] / kx).toFixed(6), bearing: +(((Math.atan2(q.dir[0], q.dir[1]) * 180) / Math.PI + 360) % 360).toFixed(1), dist: +q.r.d.toFixed(1), side: q.r.side, rw: q.r.rw, run: run.length * 10 }); }
      run = [];
    };
    for (const q of pts) {
      const r = near(R, q.p, q.dir, 22);
      if (r && r.d >= 4 && r.ang < 20) { q.r = r; run.push(q); } else flush();
    }
    flush();
    // control: a point with no railway, tram or other track within 100 m
    if (rnd() < 0.25) {
      const q = pts[Math.floor(rnd() * pts.length)];
      if (q && !near(R, q.p, null, 100) && !near(T, q.p, null, 100)) out.control.push({ id: `${ISO}-${town}-${s.id}-c`, country: ISO, town, way: s.id, name: s.name, hw: s.hw, lat: +(q.p[1] / ky).toFixed(6), lon: +(q.p[0] / kx).toFixed(6), bearing: +(((Math.atan2(q.dir[0], q.dir[1]) * 180) / Math.PI + 360) % 360).toFixed(1) });
    }
  }
}
console.log(JSON.stringify(out));
