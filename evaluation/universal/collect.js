// Run in the app's page (localhost with ?osm=balik, server with EVAL_SAVE=1): each point of /zz-pts.json is cut as on a
// click and its profile kept (the cut, its sources, the parts A→B), then saved to evaluation/universal/data/app.json.
// The universal judging (Bára 17. 11. 2026). In the console or javascript_tool: await collectApp()
async function collectApp() {
  const pts = await (await fetch("/zz-pts.json", { cache: "reload" })).json();
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  window.__app = window.__app || [];
  for (const p of pts) {
    if (window.__app.some((r) => r.id === p.id)) continue;
    localStorage.removeItem("streetdesign-pilot");
    let row = { id: p.id, country: p.country, town: p.town };
    try {
      await window.cutAt(p.lat, p.lon);
      const s = read();
      row = { ...row, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, name: s.cut?.name || "", span: s.cut?.span, sources: s.cut?.sources, note: s.cut?.note,
        parts: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2)]) };
    } catch (e) { row.error = String(e); }
    window.__app.push(row);
    if (window.__app.length % 20 === 0) await fetch("/api/eval-save?name=app", { method: "POST", body: JSON.stringify(window.__app) });
  }
  await fetch("/api/eval-save?name=app", { method: "POST", body: JSON.stringify(window.__app) });
  return window.__app.length;
}
// Re-collection of 24. 11. 2026: every judged cut again from the current code, at the judged cut (lat, lon, bearing as a
// link reopens it), with the clicked way's highway / service tags from the state's OSM pack. Saved to data/app-zprepocet.json.
async function collect24(name = "app-zprepocet") {
  const pts = await (await fetch("/zz-pts.json", { cache: "reload" })).json();
  const sources = await import("/sources.js");
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  window.__app = window.__app || [];
  const save = () => fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(window.__app) });
  for (const p of pts) {
    if (window.__app.some((r) => r.id === p.id)) continue;
    localStorage.removeItem("streetdesign-pilot");
    let row = { id: p.id, country: p.country, town: p.town };
    const t0 = Date.now();
    try {
      await Promise.race([window.cutAt(p.lat, p.lon, false, p.bearing), new Promise((_, no) => setTimeout(() => no(new Error("timeout 90 s")), 90000))]);
      const s = read();
      row = { ...row, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, wayId: s.cut?.wayId, name: s.cut?.name || "", span: s.cut?.span, sources: s.cut?.sources, note: s.cut?.note,
        parts: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2)]) };
      try {
        const o = await sources.osm(p.lat, p.lon, 40);
        const els = o?.elements || o?.ways || o || [];
        const w = (Array.isArray(els) ? els : []).find((e) => e.id === s.cut?.wayId && e.tags?.highway);
        if (w?.tags) { row.highway = w.tags.highway; if (w.tags.service) row.service = w.tags.service; }
      } catch (e) { row.tagError = String(e); }
    } catch (e) { row.error = String(e); }
    row.ms = Date.now() - t0;
    window.__app.push(row);
    if (window.__app.length % 10 === 0) await save();
  }
  await save();
  return window.__app.length;
}
window.collect24 = collect24;
