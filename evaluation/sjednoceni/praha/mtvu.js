// The changed Prague cuts against MTVU as the truth of the street (run in the app's page): the surfaces of MTVU along every
// 2 m of the cut's way within 50 m of both variants' places, 15 m to each side, 0.5 m apart; the street's usual surface at
// each offset is the one most stations have. A variant's share: how much of its own line has the usual surface. A cut on a
// mouth, a driveway or a junction has less. Also the carriageway (700, 701, 705) of the line against the stations' median.
export async function mtvuShare(rows, KEYS = ["O", "N"]) {
  const gis = await import("/gis.js"), sources = await import("/sources.js"), D = await import("/derive.js");
  const out = [];
  for (const r of rows) {
    try {
      const a = r.O, frame = D.localFrame(a.lat, a.lon), osm = await gis.osmTiles(a.lat, a.lon, 200);
      const polys = D.mtvuPolygons(await sources.mtvu([a.lon - 0.0016, a.lat - 0.001, a.lon + 0.0016, a.lat + 0.001].join(","), {}), frame);
      const inside = (p, x, y) => { let c = false; for (const g of p.rings) for (let i = 0, j = g.length - 1; i < g.length; j = i++) { const [xi, yi] = g[i], [xj, yj] = g[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
      const kind = (x, y) => { const p = polys.find((q) => inside(q, x, y)); const c = p?.code; return c === 700 || c === 701 || c === 705 ? "v" : c >= 600 && c < 700 ? "b" : c >= 401 && c < 403 ? "z" : c ? String(c) : "?"; };
      const line = (w) => { const n = [-w[1].dir[1], w[1].dir[0]]; const s = []; for (let t = -15; t <= 15; t += 0.5) s.push(kind(w[0][0] + n[0] * t, w[0][1] + n[1] * t)); return s; };
      const way = osm.elements.find((e) => e.id === r.N.wayId) || osm.elements.find((e) => e.id === a.wayId);
      const pts = way.geometry.map((g) => frame.toXY(g.lon, g.lat));
      // The places of the variants as offset from the way; the stations along it.
      const place = (v) => { const p = frame.toXY(v.lon, v.lat), s = D.snapToWay(pts, p); let d = 0; for (let i = 0; i < s.index; i++) d += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); d += Math.hypot(s.point[0] - pts[s.index][0], s.point[1] - pts[s.index][1]); const n = [-s.dir[1], s.dir[0]]; return { d, dir: s.dir, off: (p[0] - s.point[0]) * n[0] + (p[1] - s.point[1]) * n[1], p }; };
      const P = Object.fromEntries(KEYS.map((k) => [k, place(r[k])]));
      const off = P.N.off, lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), total = lens.reduce((x, y) => x + y, 0);
      const at = (d) => { for (let i = 0; i < lens.length; i++) { if (d <= lens[i] || i === lens.length - 1) { const u = [(pts[i + 1][0] - pts[i][0]) / lens[i], (pts[i + 1][1] - pts[i][1]) / lens[i]], c = [pts[i][0] + u[0] * d - u[1] * off, pts[i][1] + u[1] * d + u[0] * off]; return [c, { dir: u }]; } d -= lens[i]; } };
      const L = [];
      for (let d = 0; d <= total; d += 2) if (KEYS.some((k) => Math.abs(d - P[k].d) <= 50)) L.push(line(at(d)));
      if (L.length < 8) { out.push({ id: r.id, note: "krátká cesta" }); continue; }
      const usual = L[0].map((_, i) => { const n = {}; for (const s of L) n[s[i]] = (n[s[i]] || 0) + 1; return Object.entries(n).sort((x, y) => y[1] - x[1])[0][0]; });
      const med = (x) => x.sort((p, q) => p - q)[Math.floor(x.length / 2)];
      const car = (s) => s.filter((k) => k === "v").length * 0.5, usualCar = med(L.map(car));
      const row = { id: r.id, stations: L.length, usualCar };
      for (const k of KEYS) { const s = line([P[k].p, { dir: P[k].dir }]); row[k] = +(s.filter((x, i) => x === usual[i]).length / s.length).toFixed(3); row["car" + k] = +(car(s) - usualCar).toFixed(1); }
      row.moved = +Math.hypot(P.O.p[0] - P.N.p[0], P.O.p[1] - P.N.p[1]).toFixed(1);
      out.push(row);
    } catch (e) { out.push({ id: r.id, error: String(e) }); }
  }
  return out;
}
