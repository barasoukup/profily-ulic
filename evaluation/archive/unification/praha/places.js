// Places by the junction rule only (no profile), their MTVU share against the usual surface.
export async function tune(points, CL, say) {
  const gis = await import("/gis.js"), S = await import("/sources.js"), D = await import("/derive.js"), { P } = await import("/ortho-osm.js");
  const out = [];
  for (const p of points) {
    try {
      const frame = D.localFrame(p.lat, p.lon), osm = await gis.osmTiles(p.lat, p.lon, 80);
      const near0 = D.nearestStreet(osm, frame, [0, 0]);
      const V = {};
      for (const [k, off, cl] of CL) { P.off = new Set(off); P.svcClear = cl; const n = D.centerOnStreet(osm, frame, D.awayFromJunctions(osm, frame, near0)); V[k] = { p: n.point, dir: n.dir }; }
      P.off = new Set(); P.svcClear = 0;
      const pts = near0.pts;
      const uniq = new Set(Object.values(V).map((v) => v.p.map((x) => x.toFixed(1)).join()));
      if (uniq.size < 2) { out.push({ id: p.id, same: 1 }); continue; }
      const polys = D.mtvuPolygons(await S.mtvu([p.lon - 0.0016, p.lat - 0.001, p.lon + 0.0016, p.lat + 0.001].join(","), {}), frame);
      const inside = (q, x, y) => { let c = false; for (const g of q.rings) for (let i = 0, j = g.length - 1; i < g.length; j = i++) { const [xi, yi] = g[i], [xj, yj] = g[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
      const kind = (x, y) => { const c = polys.find((q) => inside(q, x, y))?.code; return c === 700 || c === 701 || c === 705 ? "v" : c >= 600 && c < 700 ? "b" : c >= 401 && c < 403 ? "z" : c ? String(c) : "?"; };
      const line = (c, d) => { const n = [-d[1], d[0]], s = []; for (let t = -15; t <= 15; t += 0.5) s.push(kind(c[0] + n[0] * t, c[1] + n[1] * t)); return s; };
      const off = (() => { const v = Object.values(V)[0], s = D.snapToWay(pts, v.p), n = [-s.dir[1], s.dir[0]]; return (v.p[0] - s.point[0]) * n[0] + (v.p[1] - s.point[1]) * n[1]; })();
      const L = [];
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), u = [(pts[i][0] - pts[i - 1][0]) / l, (pts[i][1] - pts[i - 1][1]) / l]; for (let d = 0; d < l; d += 2) { const c = [pts[i - 1][0] + u[0] * d - u[1] * off, pts[i - 1][1] + u[1] * d + u[0] * off]; if (Math.hypot(...c) < 55) L.push(line(c, u)); } }
      if (L.length < 8) { out.push({ id: p.id, short: 1 }); continue; }
      const usual = L[0].map((_, i) => { const n = {}; for (const s of L) n[s[i]] = (n[s[i]] || 0) + 1; return Object.entries(n).sort((x, y) => y[1] - x[1])[0][0]; });
      const row = { id: p.id };
      for (const k in V) { const s = line(V[k].p, V[k].dir); row[k] = +(s.filter((x, i) => x === usual[i]).length / s.length).toFixed(3); row["m" + k] = +Math.hypot(V[k].p[0] - Object.values(V)[0].p[0], V[k].p[1] - Object.values(V)[0].p[1]).toFixed(1); }
      out.push(row);
    } catch (e) { out.push({ id: p.id, error: String(e) }); }
    say?.(out.length);
    await new Promise((r) => setTimeout(r, 300));
  }
  return out;
}
