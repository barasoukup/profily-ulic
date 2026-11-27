// Run in the app's page (localhost, server with EVAL_SAVE=1, ?osm=balik; the points in app/public/zz-rail.json, not
// kept in git): each point is cut as on a click (at the street's bearing) and its profile kept, to
// evaluation/universal/data/<name>.json. With ?off=railway the name is rail-off, else rail-on (Bára 27. 11. 2026).
//   await collectRail()
async function collectRail() {
  const q = new URLSearchParams(location.search), file = q.get("points") || "/zz-rail.json";
  const pts = await (await fetch(file, { cache: "reload" })).json();
  const name = q.get("name") || (q.get("off")?.includes("railway") ? "rail-off" : "rail-on");
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  window.__rail = window.__rail || [];
  const save = () => fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(window.__rail) });
  for (const p of pts) {
    if (window.__rail.some((r) => r.id === p.id)) continue;
    localStorage.removeItem("streetdesign-pilot");
    let row = { id: p.id, country: p.country, town: p.town, kind: p.kind };
    const t0 = Date.now();
    try {
      await Promise.race([window.cutAt(p.lat, p.lon, false, p.bearing, p.reach || null), new Promise((_, no) => setTimeout(() => no(new Error("timeout 90 s")), 90000))]);
      const s = read();
      row = { ...row, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, wayId: s.cut?.wayId, name: s.cut?.name || "", span: s.cut?.span, note: s.cut?.note,
        parts: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), ...(x.narrow ? ["narrow"] : [])]) };
    } catch (e) { row.error = String(e); }
    row.ms = Date.now() - t0;
    window.__rail.push(row);
    if (window.__rail.length % 10 === 0) await save();
  }
  await save();
  return window.__rail.length;
}
window.collectRail = collectRail;
