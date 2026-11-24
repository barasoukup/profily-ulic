// Run in the app's page (localhost with ?osm=balik, server with EVAL_SAVE=1): each point cut once per variant in the same
// place. A variant: { key, q (the page's query), off (ortho-osm.js P.off, set live: app.js reads ?off= only at load) }.
// Kept: the cut, its way's kind, span, parts with their sources. Saved to evaluation/universal/data/<name>.json (then
// moved to vysledky/).   await collectAB3(POINTS, VARIANTS, "ab3-fi-new")
async function collectAB3(POINTS, VARIANTS, name) {
  const store = (window.__ab3 ||= {}), rows = (store[name] ||= []);
  const gis = await import("/gis.js"), oo = await import("/ortho-osm.js");
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  const one = (s) => ({ name: s.cut?.name, wayId: s.cut?.wayId, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, span: s.cut?.span, sources: s.cut?.sources,
    note: s.cut?.note, segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || ""]), edges: [s.stav?.edges?.left, s.stav?.edges?.right] });
  for (const p of POINTS) {
    if (rows.some((r) => r.id === p.id)) continue;
    const row = { id: p.id, group: p.group, place: p.place };
    for (const v of VARIANTS) {
      history.replaceState(null, "", v.q);
      oo.P.off = new Set(v.off || []);
      localStorage.removeItem("streetdesign-pilot");
      try { await window.cutAt(p.lat, p.lon); row[v.key] = one(read()); } catch (e) { row[v.key] = { error: String(e) }; }
    }
    try {
      const b = Object.values(row).find((x) => x?.wayId);
      const o = await gis.osmTiles(b.lat, b.lon, 40);
      const w = o.elements.find((el) => el.id === b.wayId);
      row.highway = w?.tags?.highway || null;
      row.service = w?.tags?.service || null;
    } catch {}
    rows.push(row);
    if (rows.length % 10 === 0) await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
  }
  history.replaceState(null, "", "?osm=balik");
  oo.P.off = new Set();
  await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
  return rows.length;
}

// The new sample (sample.mjs → kandidati.json): the candidates within 20 m of an OSM highway=residential way inside
// Helsinki, snapped onto it, at most `per` a suburb, the first `n`.   await pickResidential(CANDIDATES)
async function pickResidential(CANDIDATES, per = 2, n = 32) {
  const gis = await import("/gis.js"), fi = await import("/towns/finland.js"), { localFrame } = await import("/derive.js");
  const out = [], count = {};
  for (const p of CANDIDATES) {
    if (out.length >= n) break;
    if ((count[p.place] || 0) >= per || !fi.inHelsinki(p.lon, p.lat)) continue;
    const o = await gis.osmTiles(p.lat, p.lon, 40), fr = localFrame(p.lat, p.lon);
    let best = null;
    for (const w of o.elements) {
      if (w.type !== "way" || w.tags?.highway !== "residential" || Number(w.tags.layer) < 0 || w.tags.tunnel || w.tags.bridge) continue;
      const g = w.geometry.map((q) => fr.toXY(q.lon, q.lat));
      for (let i = 0; i + 1 < g.length; i++) {
        const [a, b] = [g[i], g[i + 1]], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / L)) : 0, q = [a[0] + t * dx, a[1] + t * dy], d = Math.hypot(...q);
        if (!best || d < best.d) best = { d, q, way: w.id };
      }
    }
    // Not the nearest way at all (another road closer), or too far.
    if (!best || best.d > 20) continue;
    const [lon, lat] = fr.toLonLat(...best.q);
    out.push({ ...p, lat: +lat.toFixed(6), lon: +lon.toFixed(6), way: best.way });
    count[p.place] = (count[p.place] || 0) + 1;
  }
  return out;
}
