// The attic (Bára 23. 11. 2026): GURS's cadastre counts a habitable attic as a floor. For each house of the A/B
// (vysledky/rezy.json) and each OSM building of vysledky/osm-levels.json: the raw building of STAVBE at the same point
// (the heights H1 = the floor of the lowest storey, H2 = the highest point of the roof, H3 = the terrain at the main
// entrance, all metres above the sea; Pravilnik o vodenju podatkov katastra nepremičnin, Ur. l. RS 41/2022) and its
// storeys from the layer ETAZE (each storey's number, its floor above the sea, its height and its area). Politely: one
// request at a time, a pause of 1.5 s, the answers kept in data/raw.json (a second run asks nothing again).
//   node evaluation/slovenia/ab/attic.mjs → data/raw.json
import fs from "node:fs";
import { GURS_KN, gursUrl } from "../../../pilot/public/towns/slovenia.js";

const HERE = new URL("./", import.meta.url), CACHE = new URL("data/raw.json", HERE);
const raw = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const FIELDS = "EID_STAVBA,STEVILO_ETAZ,STEVILKA_PRITL_ETAZE,LETO_IZGRADNJE,VISINA_H1,VISINA_H2,VISINA_H3,TIPI_STAVB_NAZIV_SL,STEVILO_STANOVANJ,OBRIS_GEOM";
async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(40000) });
      if (r.ok) return await r.json();
    } catch {}
    await pause(5000);
  }
  return null;
}
const inside = (rings, x, y) => { let c = false; for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const ringsOf = (g) => (g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []);
async function building(lat, lon) {
  for (const d of [0.00001, 0.00006]) {
    const url = gursUrl(lat, lon, d).replace(/PROPERTYNAME=[^&]*/, `PROPERTYNAME=${encodeURIComponent(FIELDS)}`);
    const json = await get(url); await pause(1500);
    const fs_ = json?.features || [];
    const here = fs_.filter((f) => ringsOf(f.properties?.OBRIS_GEOM || f.geometry).some((r) => inside(r, lon, lat)));
    const f = here[0] || (d > 0.00002 ? fs_[0] : null);
    if (f) { const p = { ...f.properties }; delete p.OBRIS_GEOM; return p; }
  }
  return null;
}
async function storeys(eid) {
  const filter = `<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0"><fes:PropertyIsEqualTo><fes:ValueReference>EID_STAVBA</fes:ValueReference><fes:Literal>${eid}</fes:Literal></fes:PropertyIsEqualTo></fes:Filter>`;
  const url = `${GURS_KN}?${new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: "SI.GURS.KN:ETAZE", outputFormat: "application/json", count: "80",
    PROPERTYNAME: "STEVILKA_ETAZE,NADMORSKA_VISINA,VISINA_ETAZE,POVRSINA,PRITLICNA_ETAZA_NAZIV_SL", FILTER: filter })}`;
  const json = await get(url); await pause(1500);
  return (json?.features || []).map((f) => f.properties).sort((a, b) => a.STEVILKA_ETAZE - b.STEVILKA_ETAZE);
}
const rows = JSON.parse(fs.readFileSync(new URL("vysledky/rezy.json", HERE), "utf8"));
const lev = JSON.parse(fs.readFileSync(new URL("vysledky/osm-levels.json", HERE), "utf8"));
const points = [...rows.map((r) => [r.id, r.lat, r.lon]), ...lev.map((l, i) => [`osm-${l.town}-${i}`, l.lat, l.lon])];
for (const [id, lat, lon] of points) {
  if (raw[id]) continue;
  const b = await building(lat, lon);
  raw[id] = { lat, lon, b, etaze: b?.EID_STAVBA ? await storeys(b.EID_STAVBA) : [] };
  fs.writeFileSync(CACHE, JSON.stringify(raw, null, 1));
  console.log(id, b ? `${b.STEVILO_ETAZ}/${b.STEVILKA_PRITL_ETAZE} H ${b.VISINA_H1} ${b.VISINA_H2} ${b.VISINA_H3} etaží ${raw[id].etaze.length}` : "–");
}
