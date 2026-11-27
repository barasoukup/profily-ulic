// Run in the app's page (http://localhost:5180/?osm=balik) with POINTS = vzorek.json: each point is cut twice in the
// same place, without the towns' passports (?pasport=0, A: today's estimate from the orthophoto and OSM) and with them
// (B), and both profiles kept: the cut, its span, the parts, where the surfaces came from. Results to window.__ab
// (copied to results/rezy.json).
async function collectAB(POINTS) {
  window.__ab = window.__ab || [];
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  const one = (s) => ({ name: s.cut?.name, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, span: s.cut?.span, sources: s.cut?.sources,
    note: s.cut?.note, segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || ""]), edges: [s.stav?.edges?.left, s.stav?.edges?.right] });
  for (const p of POINTS) {
    if (window.__ab.some((r) => r.id === p.id)) continue;
    const row = { id: p.id, town: p.town };
    for (const [k, q] of [["A", "?osm=balik&pasport=0"], ["B", "?osm=balik"]]) {
      history.replaceState(null, "", q);
      localStorage.removeItem("streetdesign-pilot");
      try { await window.cutAt(p.lat, p.lon); row[k] = one(read()); } catch (e) { row[k] = { error: String(e) }; }
    }
    window.__ab.push(row);
  }
  history.replaceState(null, "", "?osm=balik");
  return window.__ab.length;
}
