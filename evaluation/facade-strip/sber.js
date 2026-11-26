// Run in the app's page (localhost, ?osm=balik, server with EVAL_SAVE=1), as ../finland/ab3/sber.js: each point cut once
// per variant in the same place (O: ?off=fasada, as before; N: the strip at the facade joins the sidewalk). Saved to
// evaluation/universal/data/<name>.json (then moved to vysledky/).   collectFacade(POINTS, "facade-ab")
async function collectFacade(POINTS, name, VARIANTS = [{ key: "O", off: ["fasada"] }, { key: "N", off: [] }]) {
  const store = (window.__fs ||= {}), rows = (store[name] ||= []);
  const oo = await import("/ortho-osm.js");
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  const one = (s) => ({ name: s.cut?.name, wayId: s.cut?.wayId, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, span: s.cut?.span, sources: s.cut?.sources,
    segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || ""]), edges: [s.stav?.edges?.left, s.stav?.edges?.right] });
  for (const p of POINTS) {
    if (rows.some((r) => r.id === p.id)) continue;
    const row = { id: p.id, group: p.group, place: p.place };
    for (const v of VARIANTS) {
      oo.P.off = new Set(v.off);
      localStorage.removeItem("streetdesign-pilot");
      try { await window.cutAt(p.lat, p.lon); row[v.key] = one(read()); } catch (e) { row[v.key] = { error: String(e) }; }
    }
    rows.push(row);
    if (rows.length % 10 === 0) await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
  }
  oo.P.off = new Set();
  await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
  return rows.length;
}

// The second sample (sample2.json): each point cut once with the strip on, counting the strips that joined a sidewalk
// (ortho-osm.js P.dbg.facade); only where one did, cut again without it (O). Saved as collectFacade's rows.
//   screenFacade(POINTS, "facade-ab2")
async function screenFacade(POINTS, name) {
  const store = (window.__fs ||= {}), rows = (store[name] ||= []), seen = (store[name + "-seen"] ||= new Set());
  const oo = await import("/ortho-osm.js");
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  const one = (s) => ({ name: s.cut?.name, wayId: s.cut?.wayId, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, span: s.cut?.span, sources: s.cut?.sources,
    segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || ""]), edges: [s.stav?.edges?.left, s.stav?.edges?.right] });
  const cut = async (p, off) => { oo.P.off = new Set(off); oo.P.dbg = {}; localStorage.removeItem("streetdesign-pilot"); try { await window.cutAt(p.lat, p.lon); return { ...one(read()), hits: oo.P.dbg.facade || 0 }; } catch (e) { return { error: String(e) }; } };
  for (const p of POINTS) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const N = await cut(p, []);
    if (N.hits) rows.push({ id: p.id, group: p.group, place: p.place, N, O: await cut(p, ["fasada"]) });
    if (seen.size % 20 === 0) await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify({ seen: seen.size, rows }) });
  }
  oo.P.off = new Set(); delete oo.P.dbg;
  await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify({ seen: seen.size, rows }) });
  window.__fsDone = true;
  return rows.length;
}
