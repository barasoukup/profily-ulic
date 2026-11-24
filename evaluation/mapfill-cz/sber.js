// The Czech mapFill A/B (Bára 24. 11. 2026): run in the app's page (localhost ?osm=balik, server with EVAL_SAVE=1),
// loaded as a module (copied to pilot/public/zz-mfcz.js, which git ignores). Each point cut once per variant; a variant
// sets countries/CZ.js mapFill live (O: false as before, N: true). Saved to evaluation/universal/data/<name>.json.
//   const m = await import("/zz-mfcz.js"); await m.collectMF(POINTS, [{ key: "O", mapFill: false }, { key: "N", mapFill: true }], "mfcz-ab")
export async function collectMF(pts, VARIANTS, name) {
  const CZ = (await import("/countries/CZ.js")).default;
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  const one = (s) => ({ name: s.cut?.name, wayId: s.cut?.wayId, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, span: s.cut?.span, sources: s.cut?.sources, note: s.cut?.note,
    segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || ""]), edges: [s.stav?.edges?.left, s.stav?.edges?.right] });
  const rows = ((window.__mf ||= {})[name] ||= []);
  const keep = CZ.mapFill;
  for (const p of pts) {
    if (rows.some((r) => r.id === p.id)) continue;
    const row = { id: p.id, town: p.town, highway: p.highway };
    for (const v of VARIANTS) {
      if ("mapFill" in v) CZ.mapFill = v.mapFill;
      localStorage.removeItem("streetdesign-pilot");
      const t0 = Date.now();
      try {
        await Promise.race([window.cutAt(p.lat, p.lon), new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 120000))]);
        row[v.key] = one(read());
      } catch (e) { row[v.key] = { error: String(e) }; }
      row[v.key].ms = Date.now() - t0;
    }
    rows.push(row);
    window.__mfStatus = `${rows.length}/${pts.length}`;
    if (rows.length % 5 === 0) await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
  }
  CZ.mapFill = keep;
  await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
  window.__mfStatus = "done " + rows.length;
  return rows.length;
}
