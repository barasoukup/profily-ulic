// Run in the app's page (http://localhost:5206/?osm=balik, server with EVAL_SAVE=1) as collectWbn(POINTS, name) with
// POINTS = sample.json: each point cut twice in the same place, A without WBN (?wbn=0, today's estimate from the
// orthophoto and OSM with GRB's lines), B with it; each profile kept (the cut, its span, the parts and where they came
// from). Saved to evaluation/universal/data/<name>.json (moved to vysledky/rezy.json).
window.collectWbn = async function (POINTS, name) {
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  const one = (s) => ({ name: s.cut?.name, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, span: s.cut?.span, sources: s.cut?.sources,
    note: s.cut?.note, segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || ""]) });
  const rows = (window.__wbn = []);
  for (const p of POINTS) {
    const row = { id: p.id, town: p.town, lat: p.lat, lon: p.lon };
    for (const [k, q] of [["A", "?osm=balik&wbn=0"], ["B", "?osm=balik"]]) {
      history.replaceState(null, "", q);
      localStorage.removeItem("streetdesign-pilot");
      try { await window.cutAt(p.lat, p.lon); row[k] = one(read()); } catch (e) { row[k] = { error: String(e) }; }
    }
    rows.push(row);
  }
  history.replaceState(null, "", "?osm=balik");
  await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
  return rows.length;
};
