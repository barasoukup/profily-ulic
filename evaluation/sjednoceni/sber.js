// The A/B of the unification (Bára 24. 11. 2026, as ../mapfill-cz/sber.js): run in the app's page (localhost ?osm=balik,
// server with EVAL_SAVE=1), loaded as a module (copied to pilot/public/zz-sjed.js, which git ignores).
//   const m = await import("/zz-sjed.js");
//   const pts = await m.pick(CANDIDATES);                       // snapped onto car streets
//   await m.collect(pts, [{ key: "O" }, { key: "N", set: { CZ: { besidePassport: true, besideMax: 25 } } }], "sj-pasporty")
// A variant: key, set (country module fields set live, by ISO code), off (ortho-osm.js P.off; city.fix is gone since
// 25. 11. 2026, its rules have ?off= switches: obsluzne, ulicky, protejsi, osafix, osaroad, pocetpruhu), free (cut from the point itself,
// not from the first variant's). Each point is cut once per variant in the same place
// (the first variant's snapped point and bearing). Saved to evaluation/universal/data/<name>.json.
const CAR = new Set(["primary", "secondary", "tertiary", "unclassified", "residential", "living_street", "trunk", "motorway",
  "primary_link", "secondary_link", "tertiary_link", "trunk_link", "motorway_link"]);

export async function pick(CANDIDATES, { max = 25, apart = 100, ways = CAR } = {}) {
  const gis = await import("/gis.js"), { localFrame } = await import("/derive.js");
  const out = [];
  for (const p of CANDIDATES) {
    let o;
    try { o = await gis.osmTiles(p.lat, p.lon, 40); } catch { continue; }
    const fr = localFrame(p.lat, p.lon);
    let best = null;
    for (const w of o.elements || []) {
      if (w.type !== "way" || !ways.has(w.tags?.highway) || Number(w.tags.layer) < 0 || w.tags.tunnel || w.tags.bridge || w.tags.area === "yes") continue;
      const g = w.geometry.map((q) => fr.toXY(q.lon, q.lat));
      for (let i = 0; i + 1 < g.length; i++) {
        const [a, b] = [g[i], g[i + 1]], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / L)) : 0, q = [a[0] + t * dx, a[1] + t * dy], d = Math.hypot(...q);
        if (!best || d < best.d) best = { d, q, way: w.id, highway: w.tags.highway, name: w.tags.name };
      }
    }
    if (!best || best.d > max) continue;
    const [lon, lat] = fr.toLonLat(...best.q);
    const far = (q) => Math.hypot((lat - q.lat) * 110574, (lon - q.lon) * 111320 * Math.cos((lat * Math.PI) / 180)) >= apart;
    if (!out.every(far)) continue;
    out.push({ ...p, lat: +lat.toFixed(6), lon: +lon.toFixed(6), way: best.way, highway: best.highway, name: best.name });
  }
  return out;
}

export async function collect(pts, VARIANTS, name) {
  const { COUNTRIES } = await import("/countries/index.js");
  const oo = await import("/ortho-osm.js"), C = await import("/city.js");
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  const one = (s) => ({ name: s.cut?.name, city: s.cut?.city, wayId: s.cut?.wayId, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, reach: s.cut?.reach, span: s.cut?.span, sources: s.cut?.sources, note: s.cut?.note,
    segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || ""]), edges: [s.stav?.edges?.left, s.stav?.edges?.right] });
  const rows = ((window.__sj ||= {})[name] ||= []);
  for (const p of pts) {
    if (rows.some((r) => r.id === p.id)) continue;
    const row = { id: p.id, place: p.place, highway: p.highway };
    let at = null;
    for (const v of VARIANTS) {
      const kept = [];
      for (const [iso, fields] of Object.entries(v.set || {})) for (const [k, val] of Object.entries(fields)) {
        kept.push([COUNTRIES[iso], k, Object.hasOwn(COUNTRIES[iso], k), COUNTRIES[iso][k]]);
        COUNTRIES[iso][k] = val;
      }
      // app.js sets the city only when a cut changes it: set it again, so a changed field of the city holds now.
      C.setCity(C.city.id);
      oo.P.off = new Set(v.off || []);
      localStorage.removeItem("streetdesign-pilot");
      const t0 = Date.now();
      try {
        // The same place and direction for every variant: the first one's snapped point and bearing (a fix may move the cut).
        // A point with a bearing (a judged cut of the universal measurement) is cut as its link reopens it.
        const job = at && !v.free ? window.cutAt(at.lat, at.lon, false, at.bearing) : p.bearing != null ? window.cutAt(p.lat, p.lon, false, p.bearing) : window.cutAt(p.lat, p.lon);
        await Promise.race([job, new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 120000))]);
        row[v.key] = { ...one(read()), country: C.city.country };
        if (!at) at = row[v.key];
      } catch (e) { row[v.key] = { error: String(e) }; }
      row[v.key].ms = Date.now() - t0;
      for (const [m, k, own, val] of kept.reverse()) { if (own) m[k] = val; else delete m[k]; }
    }
    C.setCity(C.city.id);
    oo.P.off = new Set();
    rows.push(row);
    window.__sjStatus = `${rows.length}/${pts.length}`;
    if (rows.length % 5 === 0) await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
  }
  await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
  window.__sjStatus = "done " + rows.length;
  return rows.length;
}
