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
