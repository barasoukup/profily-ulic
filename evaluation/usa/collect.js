// The USA's A/B and measurement (24. 11. 2026): run in the app's page (localhost, ?osm=balik, server with EVAL_SAVE=1).
// Each point of /zz-pts.json is cut in each of its variants (p.variants: names of VARIANTS) and saved to
// evaluation/universal/data/<name>.json as rows { id, variant, lat, lon, bearing, name, sources, note, parts }.
// A variant sets the map's switches in the address (?dc=0) and the shared changes' switches (ortho-osm.js P.off).
// Pasted into the page with javascript_tool (the CSP allows no eval): window.__run = collectUs("us-ab"), then read
// window.__app.length.
const VARIANTS = {
  def: { q: "", off: [] },
  dc0: { q: "dc=0", off: [] },
  dcold: { q: "off=dcarterials", off: ["dcarterials"] }, // the arterials as before 25. 11. 2026 (towns/usa.js)
  ul: { q: "off=ulicky", off: ["ulicky"] },
  ja: { q: "off=treepits", off: ["treepits"] },
  pp: { q: "off=pocetpruhu", off: ["pocetpruhu"] },
  // Without DC's map, the orthophoto and the model: the page itself loaded with ?dc=0&orto=0&ai=0 (read once at the load).
  map0: { q: "toronto=0", off: [] }, // Canada (evaluation/canada): without the map of Toronto
  ddot0: { q: "ddot=0", off: [] }, // Washington: the map without DDOT's inventory
  gaps0: { q: "off=mapgaps", off: [] }, // Toronto's rules one by one
  bays0: { q: "off=kerbbays", off: [] },
  // (os0 was measured when the default was what ?otherstreet=1 is now.)
  os0: { q: "off=otherstreet", off: ["otherstreet"] }, // the shared rules of the second review
  tt0: { q: "off=tunneltracks", off: ["tunneltracks"] },
  rt0: { q: "off=roadtracks", off: [] }, // Canada: without OSM's cycle tracks in the map's carriageway
  bos0: { q: "boston=0&cambridge=0", off: [] }, // Boston (evaluation/usa/boston): without the maps of Boston and Cambridge
  osm: { q: "dc=0&toronto=0&boston=0&cambridge=0&orto=0&ai=0", off: [], load: true },
  old: { q: "off=ulicky,treepits,pocetpruhu", off: ["ulicky", "treepits", "pocetpruhu"] },
};
async function collectUs(name) {
  const pts = await (await fetch("/zz-pts.json", { cache: "reload" })).json();
  const P = (await import("/ortho-osm.js")).P;
  const STORE = location.search.includes("orto=0") ? "streetdesign-pilot-bez-orto" : "streetdesign-pilot";
  const read = () => JSON.parse(localStorage.getItem(STORE) || "{}");
  window.__app = window.__app || [];
  const save = () => fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(window.__app) });
  const only = location.search.includes("orto=0") ? ["osm"] : null;
  for (const p of pts) for (const v of only || p.variants || ["def"]) {
    if (window.__app.some((r) => r.id === p.id && r.variant === v)) continue;
    const V = VARIANTS[v];
    history.replaceState(null, "", `/?osm=balik${V.q ? `&${V.q}` : ""}`);
    P.off = new Set(V.off);
    localStorage.removeItem(STORE);
    let row = { id: p.id, variant: v, country: p.country, town: p.town };
    const t0 = Date.now();
    try {
      await Promise.race([window.cutAt(p.lat, p.lon, false, p.click ? null : p.bearing ?? null, null, null, p.click ? null : p.wayId ?? null), new Promise((_, no) => setTimeout(() => no(new Error("timeout 90 s")), 90000))]);
      const s = read();
      row = { ...row, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, wayId: s.cut?.wayId, name: s.cut?.name || "", sources: s.cut?.sources, note: s.cut?.note, status: document.querySelector("#status")?.textContent || "", edges: s.stav?.edges,
        parts: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2)]) };
    } catch (e) { row.error = String(e); }
    row.ms = Date.now() - t0;
    window.__app.push(row);
    if (window.__app.length % 10 === 0) await save();
  }
  await save();
  history.replaceState(null, "", "/?osm=balik");
  P.off = new Set();
  return window.__app.length;
}
window.collectUs = collectUs;
