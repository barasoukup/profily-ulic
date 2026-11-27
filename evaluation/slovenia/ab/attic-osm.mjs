// The attic, a larger check than the photos (Bára 23. 11. 2026): OSM buildings that say both building:levels (the
// floors below the roof) and roof:levels (the floors in it), seeded, in five towns, stratified (attic in a pitched roof,
// a pitched roof without one, a flat roof), each asked of GURS's cadastre at a point inside its outline (the raw
// building: floors, ground floor, H2 the roof's top, H3 the terrain at the entrance). Where GURS's floors above the
// ground equal building:levels + roof:levels with roof:levels ≥ 1, the cadastre's top floor is in the roof; where they
// equal building:levels, it is not. Politely: one request at a time, a pause of 1.5 s, kept in data/raw-osm.json.
//   node evaluation/slovenia/ab/attic-osm.mjs → data/raw-osm.json
import fs from "node:fs";
import { gursUrl } from "../../../app/public/towns/slovenia.js";

const HERE = new URL("./", import.meta.url), CACHE = new URL("data/raw-osm.json", HERE);
const OSM = new URL("../../../../../../data/osm/si/si_buildings.geojsonl", import.meta.url);
const raw = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const FIELDS = "EID_STAVBA,STEVILO_ETAZ,STEVILKA_PRITL_ETAZE,LETO_IZGRADNJE,VISINA_H1,VISINA_H2,VISINA_H3,STEVILO_STANOVANJ,OBRIS_GEOM";
const inside = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const ringsOf = (g) => (g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []);
const tag = (f, k) => new RegExp(`"${k}"=>"([^"]*)"`).exec(f.properties.other_tags || "")?.[1];
const TOWNS = { ljubljana: [46.051, 14.506], maribor: [46.558, 15.646], celje: [46.231, 15.26], kranj: [46.239, 14.355], koper: [45.548, 13.73] };
const PITCHED = /gabled|hipped|half-hipped|pyramidal|gambrel|mansard|saltbox/;
const STRATA = [["attic", (rl, sh) => rl === 1 && PITCHED.test(sh), 6], ["pitched", (rl, sh) => rl === 0 && PITCHED.test(sh), 3], ["flat", (rl, sh) => rl === 0 && sh === "flat", 3], ["attic-noshape", (rl, sh) => rl === 1 && !sh, 2]];

let seed = 20261123;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const all = fs.readFileSync(OSM, "utf8").split("\n").filter((l) => l.includes("roof:levels") && l.includes("building:levels")).map((l) => JSON.parse(l))
  .filter((f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon");
const picked = [];
for (const [town, [lat0, lon0]] of Object.entries(TOWNS)) {
  const near = all.filter((f) => { const c = ringsOf(f.geometry)[0][0][0]; return Math.abs(c[1] - lat0) < 0.03 && Math.abs(c[0] - lon0) < 0.04; });
  for (const [stratum, test, n] of STRATA) {
    const pool = near.filter((f) => test(+tag(f, "roof:levels"), tag(f, "roof:shape") || "") && +tag(f, "building:levels") >= 1);
    const ids = new Set();
    while (ids.size < Math.min(n, pool.length)) ids.add(Math.floor(rnd() * pool.length));
    for (const i of ids) picked.push({ town, stratum, f: pool[i] });
  }
}
async function get(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(40000) }); if (r.ok) return await r.json(); } catch {}
    await pause(5000);
  }
  return null;
}
for (const { town, stratum, f } of picked) {
  const id = f.properties.osm_id ? `r${f.properties.osm_id}` : `w${f.properties.osm_way_id}`;
  if (raw[id]) continue;
  const ring = ringsOf(f.geometry)[0][0];
  let [x, y] = ring.slice(0, -1).reduce(([sx, sy], [px, py], _, a) => [sx + px / a.length, sy + py / a.length], [0, 0]);
  if (!inside(ring, x, y)) [x, y] = [(ring[0][0] + ring[1][0] + ring[2][0]) / 3, (ring[0][1] + ring[1][1] + ring[2][1]) / 3];
  if (!inside(ring, x, y)) continue;
  const json = await get(gursUrl(y, x).replace(/PROPERTYNAME=[^&]*/, `PROPERTYNAME=${encodeURIComponent(FIELDS)}`));
  await pause(1500);
  const here = (json?.features || []).filter((g) => ringsOf(g.geometry).some((poly) => inside(poly[0], x, y)));
  const g = here[0]?.properties || null;
  if (g) delete g.OBRIS_GEOM;
  raw[id] = { town, stratum, lat: +y.toFixed(7), lon: +x.toFixed(7), osm: { levels: +tag(f, "building:levels"), roofLevels: +tag(f, "roof:levels"), shape: tag(f, "roof:shape") || null, height: tag(f, "height") || null, building: f.properties.building }, b: g };
  fs.writeFileSync(CACHE, JSON.stringify(raw, null, 1));
  console.log(id, town, stratum, raw[id].osm.levels, "+", raw[id].osm.roofLevels, g ? `GURS ${g.STEVILO_ETAZ}/${g.STEVILKA_PRITL_ETAZE} H ${g.VISINA_H2} ${g.VISINA_H3}` : "–");
}

// The storeys (layer ETAZE: each storey's floor above the sea, where the cadastre has it) of the buildings found, for
// the check of the top storey's floor against the roof's top H2 (attic.mjs reads the same for the A/B's houses).
const { GURS_KN } = await import("../../../app/public/towns/slovenia.js");
for (const v of Object.values(raw)) {
  if (!v.b?.EID_STAVBA || v.etaze) continue;
  const filter = `<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0"><fes:PropertyIsEqualTo><fes:ValueReference>EID_STAVBA</fes:ValueReference><fes:Literal>${v.b.EID_STAVBA}</fes:Literal></fes:PropertyIsEqualTo></fes:Filter>`;
  const json = await get(`${GURS_KN}?${new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: "SI.GURS.KN:ETAZE", outputFormat: "application/json", count: "80",
    PROPERTYNAME: "STEVILKA_ETAZE,NADMORSKA_VISINA,VISINA_ETAZE,POVRSINA", FILTER: filter })}`);
  await pause(1500);
  v.etaze = (json?.features || []).map((f) => f.properties).sort((a, b) => a.STEVILKA_ETAZE - b.STEVILKA_ETAZE);
  fs.writeFileSync(CACHE, JSON.stringify(raw, null, 1));
}
