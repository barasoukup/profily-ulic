// Run in the app's page (http://localhost:5205/?osm=balik, server with EVAL_SAVE=1) as collectDk(POINTS, name) with
// POINTS = sample.json: each point is cut three times in the same place, A without Copenhagen's layers
// (?kbhkant=0&kbhpark=0), K with the kerb lines only (?kbhkant=1), P with the parking areas only (?kbhpark=1), and each
// profile kept (the cut, its span, the parts and where they came from). Saved to evaluation/universal/data/<name>.json
// (moved to vysledky/rezy.json).
window.collectDk = async function (POINTS, name) {
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  const one = (s) => ({ name: s.cut?.name, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, span: s.cut?.span, sources: s.cut?.sources,
    note: s.cut?.note, segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || ""]) });
  const rows = (window.__dk = []);
  for (const p of POINTS) {
    const row = { id: p.id, town: p.town, lat: p.lat, lon: p.lon };
    for (const [k, q] of [["A", "?osm=balik&kbhkant=0&kbhpark=0"], ["K", "?osm=balik&kbhkant=1&kbhpark=0"], ["P", "?osm=balik&kbhkant=0&kbhpark=1"]]) {
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
