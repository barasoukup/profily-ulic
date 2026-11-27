// Slovenia (Bára 23. 11. 2026): the state of a cut inside states.json's "slovenia". No surface map of the streets is
// published (evaluation/slovenia/SOURCES.md 2): the profile is the estimate from OSM and GURS's orthophoto DOF025
// (lanes-ortho.js "si"). The houses:
// - the buildings of the cadastre (Kataster nepremičnin, GURS WFS wfs-si-gurs-kn, layer STAVBE; CORS *, CC BY 4.0
//   "Geodetska uprava Republike Slovenije"): the floors above the ground, the year it was built, its height, the walls
//   and the dwellings. One small request a facade on a click (the outline OBRIS_GEOM at the point (TLORIS_GEOM, the footprint, is empty for many houses of Maribor), only the fields
//   used: the server refuses big queries as bulk downloads; a second one of about 7 m around when the first has no
//   footprint at the point), at most 6 s each, kept by the point rounded to about a metre.
//   ?gurs=0 leaves them out; ?off=podkrovi only the rule of the attic (gursBuilding).
import { osmTiles } from "../gis.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_SI?.[k] ?? null : new URLSearchParams(location.search).get(k));

export const GURS_KN = "https://ipi.eprostor.gov.si/wfs-si-gurs-kn/wfs";
const FIELDS = ["STEVILO_ETAZ", "STEVILKA_PRITL_ETAZE", "LETO_IZGRADNJE", "VISINA_H1", "VISINA_H2", "VISINA_H3", "NOSILNE_KONSTRUKCIJE_NAZIV_SL", "STEVILO_STANOVANJ", "STEVILO_POSLOVNIH_PROSTOROV", "OBRIS_GEOM"];
const TIMEOUT = 6000;

// The request: the buildings whose footprint (not the layer's default geometry, the centroid) touches a box of about
// a metre around the point (WFS 2.0 with a FES filter on OBRIS_GEOM; the CQL filter is refused with 403).
export function gursUrl(lat, lon, d = 0.00001) {
  const filter = `<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:gml="http://www.opengis.net/gml/3.2"><fes:BBOX><fes:ValueReference>OBRIS_GEOM</fes:ValueReference><gml:Envelope srsName="urn:ogc:def:crs:EPSG::4326"><gml:lowerCorner>${(lat - d).toFixed(7)} ${(lon - d * 1.4).toFixed(7)}</gml:lowerCorner><gml:upperCorner>${(lat + d).toFixed(7)} ${(lon + d * 1.4).toFixed(7)}</gml:upperCorner></gml:Envelope></fes:BBOX></fes:Filter>`;
  return `${GURS_KN}?${new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: "SI.GURS.KN:STAVBE", outputFormat: "application/json",
    srsName: "EPSG:4326", count: "5", PROPERTYNAME: FIELDS.join(","), FILTER: filter })}`;
}

const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
const ringsOf = (g) => (g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []);
const num = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));

// A building of the cadastre → the facts of app.js ruianFacts and the floors (as the Spanish Catastro):
// - floors above the ground: STEVILO_ETAZ counts all floors, STEVILKA_PRITL_ETAZE is the number of the ground floor among
//   them (2: one cellar below it), so ETAZ − PRITL + 1 (SOURCES.md 3; the A/B checks it on photos, ab/REPORT.md);
// - the heights (Pravilnik o vodenju podatkov katastra nepremičnin, Ur. l. RS 41/2022): H1 the floor of the lowest
//   storey (a cellar's, where there is one; empty for many houses of Maribor), H2 the highest point of the roof or the
//   walls, H3 the terrain at the main entrance, all metres above the sea. The height above the ground is H2 − H3 (else
//   H2 − H1). The cadastre has no eaves height;
// - the attic (Bára 23. 11. 2026): the cadastre counts a habitable attic as a floor. A house of 2 to 4 floors whose roof's
//   top stands less than 3 m a floor + 2 m above the entrance has no room for that many full floors under a roof: its
//   top floor is drawn in the roof (a pitched one). Tuned and scored on the same 54 houses (OSM's building:levels +
//   roof:levels and photos, ab/REPORT.md): right 31 → 37, within the noise without a held-out sample; it misses most
//   attics (the heights overlap) and takes some flat roofs for one. ?off=podkrovi turns it off (the review of 24. 11. 2026);
// - the year LETO_IZGRADNJE;
// - the walls: brick, stone, wood (solid; NOSILNE_KONSTRUKCIJE_NAZIV_SL); concrete says nothing of a panel house;
// - one dwelling and no business: a house; more dwellings: a block of flats.
export const ATTIC = { min: 2, max: 4, perFloor: 3, roof: 2 };
const offList = () => String(param("off") || "").split(",");
export function gursBuilding(p) {
  if (!p) return {};
  const all = num(p.STEVILO_ETAZ), ground = num(p.STEVILKA_PRITL_ETAZE);
  const above = all > 0 ? (ground >= 1 && ground <= all ? all - ground + 1 : all) : NaN;
  const floors = above >= 1 && above <= 60 ? above : undefined;
  const year = num(p.LETO_IZGRADNJE);
  const built = year > 1005 && year <= new Date().getFullYear() + 2 ? year : undefined;
  const top = num(p.VISINA_H2), base = num(p.VISINA_H3) > 0 ? num(p.VISINA_H3) : num(p.VISINA_H1);
  const h = top - base;
  const height = h > 1 && h < 300 ? Math.round(h * 10) / 10 : undefined;
  const attic = !offList().includes("podkrovi") && floors >= ATTIC.min && floors <= ATTIC.max && height && height < ATTIC.perFloor * floors + ATTIC.roof ? 1 : 0;
  const walls = String(p.NOSILNE_KONSTRUKCIJE_NAZIV_SL || "");
  const solid = /opeka|kamen|les|zidan/i.test(walls) || undefined;
  const flats = num(p.STEVILO_STANOVANJ), shops = num(p.STEVILO_POSLOVNIH_PROSTOROV);
  const house = (flats === 1 && !(shops > 0)) || undefined;
  const type = flats > 1 ? "apartments" : house ? "house" : undefined;
  return { built, solid, house, type, ...(floors && { cornice: floors - attic, total: floors, roof: attic, ...(attic && { roofType: 1 }) }), ...(height && { height }) };
}
// The footprint the point lies in, else the tallest of the answer (a party wall: the box touches the neighbour too).
export function gursPick(json, lat, lon) {
  const fs = json?.features || [];
  const here = fs.filter((f) => ringsOf(f.geometry).some((rings) => inRings(rings, lon, lat)));
  const tall = (a, b) => (num(b.properties?.STEVILO_ETAZ) || 0) - (num(a.properties?.STEVILO_ETAZ) || 0);
  const f = (here.length ? here : fs).slice().sort(tall)[0];
  return f ? { ...gursBuilding(f.properties), gurs: true } : {};
}

// No footprint at the point (the cadastre's outline and OSM's differ by a few metres, a courtyard): a second request of
// about 7 m around, the footprint nearest the point within NEAR metres (measured on its edges).
const NEAR = 6;
export function gursNearest(json, lat, lon, max = NEAR) {
  const mx = 111320 * Math.cos((lat * Math.PI) / 180), my = 110574;
  let best = null;
  for (const f of json?.features || []) for (const rings of ringsOf(f.geometry)) for (const r of rings) for (let i = 1; i < r.length; i++) {
    const ax = (r[i - 1][0] - lon) * mx, ay = (r[i - 1][1] - lat) * my, dx = (r[i][0] - lon) * mx - ax, dy = (r[i][1] - lat) * my - ay;
    const q = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1))), d = Math.hypot(ax + q * dx, ay + q * dy);
    if (d <= max && (!best || d < best.d)) best = { d, f };
  }
  return best ? { ...gursBuilding(best.f.properties), gurs: true } : {};
}
const ask = (lat, lon, d) => fetch(gursUrl(lat, lon, d), { signal: AbortSignal.timeout(TIMEOUT) }).then((r) => { if (!r.ok) throw new Error(`GURS ${r.status}`); return r.json(); });

const memo = new Map();
async function podlaznost(lat, lon) {
  if (param("gurs") === "0") return {};
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  if (!memo.has(key)) {
    memo.set(key, ask(lat, lon)
      .then(async (json) => { const p = gursPick(json, lat, lon); return p.gurs ? p : gursNearest(await ask(lat, lon, 0.00006), lat, lon); })
      .catch((err) => { memo.delete(key); throw err; }));
    if (memo.size > 30) memo.delete(memo.keys().next().value);
  }
  return memo.get(key);
}

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces: async () => ({ features: [], abroad: true }),
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost,
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: none (the estimate from the orthophoto and OSM).
export const SURFACE_MAPS = [];
