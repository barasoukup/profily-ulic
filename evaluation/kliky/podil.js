// The places of the variants (collect.mjs rows) against the city's own surface map, in the app's page (as
// ../sjednoceni/praha/mtvu.js): the surfaces every 2 m of the way within 50 m of the places, 15 m to each side; the usual one
// at each offset; a variant's share of its own line that is the usual surface. Run: copied to pilot/public/zz-kliky.js (git
// ignores it), rows in zz-kliky.json, server with EVAL_SAVE=1:  (await import("/zz-kliky.js")).run("kliky-podil")
export async function run(name, { gap = 400, skip = 0 } = {}) {
  const gis = await import("/gis.js"), sources = await import("/sources.js"), D = await import("/derive.js"), C = await import("/city.js");
  const rows = (await (await fetch("/zz-kliky.json")).json()).slice(skip), out = [];
  const inside = (p, x, y) => { let c = false; for (const g of p.rings) for (let i = 0, j = g.length - 1; i < g.length; j = i++) { const [xi, yi] = g[i], [xj, yj] = g[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  for (const r of rows) {
    const row = { id: r.id };
    try {
      C.setCity(C.cityAt(r.lat, r.lon)); if (C.country.atPlace) Object.assign(C.city, await C.country.atPlace(r.lon, r.lat));
      const frame = D.localFrame(r.lat, r.lon), osm = await gis.osmTiles(r.lat, r.lon, 200);
      const ask = async () => D.mtvuPolygons(await sources.mtvu([r.lon - 0.0016, r.lat - 0.001, r.lon + 0.0016, r.lat + 0.001].join(","), { highway: r.highway }), frame);
      const polys = await Promise.race([ask(), new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 60000))]);
      const kind = (x, y) => { const c = polys.find((q) => inside(q, x, y))?.code; return c === 700 || c === 701 || c === 705 ? "v" : c >= 600 && c < 700 ? "b" : c >= 401 && c < 403 ? "z" : c ? String(c) : "?"; };
      const line = (c, d) => { const n = [-d[1], d[0]], s = []; for (let t = -15; t <= 15; t += 0.5) s.push(kind(c[0] + n[0] * t, c[1] + n[1] * t)); return s; };
      const way = osm.elements.find((e) => e.id === r.way), pts = way.geometry.map((g) => frame.toXY(g.lon, g.lat));
      const V = Object.entries(r.v).map(([k, v]) => { const p = frame.toXY(v.lon, v.lat), b = (v.bearing * Math.PI) / 180; return { k, p, dir: [Math.sin(b), Math.cos(b)], s: D.snapToWay(pts, p) }; });
      const off = (v) => (v.p[0] - v.s.point[0]) * -v.s.dir[1] + (v.p[1] - v.s.point[1]) * v.s.dir[0];
      const of = V.map(off).sort((a, b) => a - b)[Math.floor(V.length / 2)], L = [];
      for (let i = 1; i < pts.length; i++) {
        const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), u = [(pts[i][0] - pts[i - 1][0]) / l, (pts[i][1] - pts[i - 1][1]) / l];
        for (let d = 0; d < l; d += 2) { const c = [pts[i - 1][0] + u[0] * d - u[1] * of, pts[i - 1][1] + u[1] * d + u[0] * of]; if (V.some((v) => Math.hypot(c[0] - v.p[0], c[1] - v.p[1]) <= 50)) L.push(line(c, u)); }
      }
      if (L.length < 8) { out.push({ ...row, short: 1 }); continue; }
      const usual = L[0].map((_, i) => { const n = {}; for (const s of L) n[s[i]] = (n[s[i]] || 0) + 1; return Object.entries(n).sort((x, y) => y[1] - x[1])[0][0]; });
      const car = (s) => s.filter((k) => k === "v").length * 0.5, med = L.map(car).sort((a, b) => a - b)[Math.floor(L.length / 2)];
      row.unknown = +(usual.filter((x) => x === "?").length / usual.length).toFixed(2);
      for (const v of V) { const s = line(v.p, v.dir); row[v.k] = +(s.filter((x, i) => x === usual[i]).length / s.length).toFixed(3); row[`c_${v.k}`] = +(car(s) - med).toFixed(1); }
      out.push(row);
    } catch (e) { out.push({ ...row, error: String(e) }); }
    window.__kl = `${out.length}/${rows.length}`;
    if (out.length % 20 === 0) await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(out) });
    await new Promise((x) => setTimeout(x, gap));
  }
  await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(out) });
  window.__kl = `done ${out.length}`;
}
