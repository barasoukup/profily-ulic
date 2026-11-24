// Run in the app's page (localhost with ?osm=balik, server with EVAL_SAVE=1) with POINTS = sample.json: each point is
// cut three times in the same place: A without Helsinki's register (?helsinki=0, the estimate from the orthophoto and
// OSM), B with it (today's code: the city's building outlines before OSM's), C with it but OSM's outlines only
// (?hkihouses=0, to count the strips at the facades). Kept: the cut, its way's kind, span, parts with their sources.
// Saved to evaluation/universal/data/ab2-fi.json (moved to vysledky/rezy.json).  await collectAB2(POINTS)
async function collectAB2(POINTS) {
  window.__ab2 = window.__ab2 || [];
  const gis = await import("/gis.js");
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  const one = (s) => ({ name: s.cut?.name, wayId: s.cut?.wayId, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, span: s.cut?.span, sources: s.cut?.sources,
    note: s.cut?.note, segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || ""]), edges: [s.stav?.edges?.left, s.stav?.edges?.right] });
  for (const p of POINTS) {
    if (window.__ab2.some((r) => r.id === p.id)) continue;
    const row = { id: p.id, group: p.group, place: p.place };
    for (const [k, q] of [["A", "?osm=balik&helsinki=0"], ["B", "?osm=balik"], ["C", "?osm=balik&hkihouses=0"]]) {
      history.replaceState(null, "", q);
      localStorage.removeItem("streetdesign-pilot");
      try { await window.cutAt(p.lat, p.lon); row[k] = one(read()); } catch (e) { row[k] = { error: String(e) }; }
    }
    try {
      const o = await gis.osmTiles(row.B.lat, row.B.lon, 40);
      const w = o.elements.find((el) => el.id === row.B.wayId);
      row.highway = w?.tags?.highway || null;
      row.service = w?.tags?.service || null;
    } catch {}
    window.__ab2.push(row);
    if (window.__ab2.length % 10 === 0) await fetch("/api/eval-save?name=ab2-fi", { method: "POST", body: JSON.stringify(window.__ab2) });
  }
  history.replaceState(null, "", "?osm=balik");
  await fetch("/api/eval-save?name=ab2-fi", { method: "POST", body: JSON.stringify(window.__ab2) });
  return window.__ab2.length;
}
