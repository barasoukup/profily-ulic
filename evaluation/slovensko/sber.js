// Run in the app's page (http://localhost:5176/?osm=balik, and again with &orto=0) with POINTS = vzorek.json: each
// point is cut (window.cutAt) and the profile kept: the cut, its span, the parts, and what the status line said
// about the orthophoto. The result goes to vysledky/<variant>.json (copied from the console).
async function collect(POINTS) {
  const out = [];
  for (const p of POINTS) {
    await window.cutAt(p.lat, p.lon);
    const s = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith("streetdesign-pilot")) || "{}"));
    const st = document.querySelector("#status")?.textContent || "";
    out.push({
      id: p.id, town: p.town, name: s.cut?.name, city: s.cut?.city, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, span: s.cut?.span, reach: s.cut?.reach,
      ortho: /z ortofota/.test(st) ? "ano" : /Ortofoto tu nepomohlo/.test(st) ? "nepomohlo" : "-", lanes: (s.stav?.segments || []).filter((x) => x.source === "ortofoto").length,
      segments: (s.stav?.segments || []).map((x) => [x.type, x.width]),
    });
  }
  return out;
}
