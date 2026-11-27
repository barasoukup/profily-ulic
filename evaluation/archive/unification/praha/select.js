// The cuts of the A/B of the junction rule and the axis fixes (Bára 25. 11. 2026), run in the app's page (copied to
// app/public/zz-vyber.js): random points (a fixed seed) in a circle around each town, at each the nearest place of one
// of three kinds, the kinds in turn:
//   s  a street for cars within 14 m of where a service way (no driveway, aisle, drive-through) joins it;
//   d  a dual carriageway: a named one-way road with its other half by name within 40 m, 14 m or less from a junction on
//      the other half only every second one;
//   l  a two-way street with lanes ≥ 2 counted in OSM (the split from 4.0 m).
// Never on a tunnel, bridge or area, 100 m apart.
const CAR = new Set(["primary", "secondary", "tertiary", "unclassified", "residential", "living_street", "trunk"]);
const NOT = new Set(["driveway", "parking_aisle", "drive-through"]);
export async function choose(TOWNS, quota = {}, seed0 = 20261125) {
  const gis = await import("/gis.js"), { localFrame } = await import("/derive.js");
  let seed = seed0;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const out = [];
  for (const [place, lat0, lon0, km] of TOWNS) {
    const want = Object.entries(quota[place] || quota["*"]), n = Object.fromEntries(want.map(([k]) => [k, 0]));
    for (let tries = 0; tries < 400 && want.some(([k, q]) => n[k] < q); tries++) {
      const r = km * 1000 * Math.sqrt(rnd()), a = rnd() * 2 * Math.PI, pick = rnd(), side = rnd() < 0.5 ? -1 : 1, dist = rnd();
      const lat = lat0 + (r * Math.cos(a)) / 110574, lon = lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180));
      const kind = want.filter(([k, q]) => n[k] < q).map(([k]) => k)[tries % want.filter(([k, q]) => n[k] < q).length];
      let o;
      try { o = await gis.osmTiles(lat, lon, 150); } catch { continue; }
      const fr = localFrame(lat, lon), xy = (g) => fr.toXY(g.lon, g.lat);
      const ways = (o.elements || []).filter((e) => e.type === "way" && e.geometry && e.tags?.highway && !e.tags.tunnel && !e.tags.bridge && !(Number(e.tags.layer) < 0) && e.tags.area !== "yes" && e.tags.junction !== "roundabout");
      const key = (g) => `${g.lat.toFixed(7)},${g.lon.toFixed(7)}`;
      const at = new Map();
      for (const w of ways) w.geometry.forEach((g, i) => { const k = key(g); if (!at.has(k)) at.set(k, []); at.get(k).push([w, i]); });
      // A point d metres along the way from vertex i.
      const along = (w, i, d) => {
        const p = w.geometry.map(xy);
        const step = d < 0 ? -1 : 1;
        d = Math.abs(d);
        for (let j = i; p[j + step]; j += step) {
          const L = Math.hypot(p[j + step][0] - p[j][0], p[j + step][1] - p[j][1]);
          if (d <= L) return [p[j][0] + (d / L) * (p[j + step][0] - p[j][0]), p[j][1] + (d / L) * (p[j + step][1] - p[j][1])];
          d -= L;
        }
        return null;
      };
      const cands = [];
      for (const w of ways) {
        const t = w.tags, oneway = t.oneway === "yes";
        if (!CAR.has(t.highway)) continue;
        w.geometry.forEach((g, i) => {
          const p = xy(g);
          if (Math.hypot(...p) > 150) return;
          if (kind === "s" && at.get(key(g)).some(([x]) => x.tags.highway === "service" && !NOT.has(x.tags.service))) cands.push([w, i, side * 14 * dist]);
          if (kind === "l" && !oneway && +t.lanes >= 2 && +t.lanes <= 2 && i % 2 === 0) cands.push([w, i, side * 40 * dist]);
          if (kind === "d" && oneway && t.name) {
            const v = w.geometry.map(xy), dir = [v[v.length - 1][0] - v[0][0], v[v.length - 1][1] - v[0][1]];
            for (const x of ways) {
              if (x.id === w.id || x.tags.name !== t.name || x.tags.oneway !== "yes" || !CAR.has(x.tags.highway)) continue;
              const u = x.geometry.map(xy), d2 = [u[u.length - 1][0] - u[0][0], u[u.length - 1][1] - u[0][1]];
              if (dir[0] * d2[0] + dir[1] * d2[1] >= 0) continue;
              const near = u.filter((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 40).length;
              if (near) { cands.push([w, i, side * 14 * dist]); break; }
            }
          }
        });
      }
      if (!cands.length) continue;
      const [w, i, d] = cands[Math.floor(pick * cands.length)];
      const q = along(w, i, d);
      if (!q) continue;
      const [lo, la] = fr.toLonLat(...q);
      if (!out.every((x) => Math.hypot((la - x.lat) * 110574, (lo - x.lon) * 111320 * Math.cos((la * Math.PI) / 180)) >= 100)) continue;
      n[kind]++;
      out.push({ id: `${place}-${kind}${n[kind]}`, place, kind, lat: +la.toFixed(6), lon: +lo.toFixed(6), way: w.id, highway: w.tags.highway, name: w.tags.name });
    }
  }
  return out;
}
