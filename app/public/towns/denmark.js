// Denmark (Bára 23. 11. 2026): the state of a cut inside states.json's "denmark" (with Bornholm). No surface map of the
// streets exists as polygons (evaluation/denmark/SOURCES.md 2): the profile is the estimate from OSM and the spring
// orthophoto of GeoDanmark (lanes-ortho.js "dk", with the app's token; without it OSM alone, said so). Its own sources:
// - Copenhagen (Københavns Kommune's WFS wfs-kbhkort.kk.dk/k101, CORS *, no key; asked only inside its box):
//   - the kerb lines of GeoDanmark (k101:vejkant: the edges of roadways and of cycle tracks along a road) as candidates
//     for the kerbs of the estimate (ortho-osm.js edges, as Belgium's GRB and PICC), ?kbhkant=0 leaves them out;
//   - the parking areas (k101:parkering_areal: polygons with the kind and angle of the stalls and their number) as the
//     parking of the cut (derive.js, as Amsterdam's parking spaces), ?kbhpark=0;
//   - the buildings (k101:bygning: GeoDanmark's outlines with BBR's year, floors, attic, eaves height, walls, use; only
//     these fields are asked: the layer holds the owner's kind too, its neighbour bygning_bbr_kbh the owner's name, never
//     asked), ?kbhbyg=0.
//   The catalogue opendata.dk states no licence for these three layers (its other layers of the city, among them the
//   parking lines p_pladser, are CC BY 4.0; the kerb lines and outlines are GeoDanmark's data, CC BY 4.0). Bára
//   24. 11. 2026 decided to use them all the same ("Kodaňská data bych použila"), credited to GeoDanmark and Københavns
//   Kommune (credits.js). A/B (evaluation/denmark/ab/REPORT.md, 72 cuts): the kerb lines better 5, worse 2; the parking
//   areas better 7, worse 2; the buildings (buildings-ab) floors in 23 houses of 30 against OSM's 15, the year in 22.
// - Aarhus (Aarhus Kommune's WFS webkort.aarhuskommune.dk, CORS *): the buildings of BBR (geokodede_bbr_bygninger: the
//   year, the use, walls and roof, the areas the floors are estimated from), the dataset "BBR-ejendomme og
//   BBR-bygninger" CC BY 4.0 on opendata.dk; ?aarbyg=0 leaves it out.
// One small request a facade, at most 6 s, kept by the point rounded to about a metre.
import { flagsOf } from "../flags.js";
import { osmTiles } from "../gis.js";
import { inArea, inside } from "../places.js";
import { polygonsOf, pathsOf } from "./shared.js";

// The switches (URL parameters; in Node globalThis.PROFILY_DK) and their defaults.
const DEFAULTS = { kbhkant: "1", kbhpark: "1", kbhbyg: "1", aarbyg: "1" };
const flag = flagsOf("PROFILY_DK");
const param = (k) => flag(k) ?? DEFAULTS[k];
export const on = (k) => param(k) === "1";

export const KBH_WFS = "https://wfs-kbhkort.kk.dk/k101/ows";
export const AAR_WFS = "https://webkort.aarhuskommune.dk/wfs/wfs";
// The municipalities' boxes (Copenhagen's WFS covers Københavns Kommune only, not Frederiksberg inside it: empty there).
export const AREAS = { kobenhavn: { box: [12.45, 55.61, 12.66, 55.735] }, aarhus: { box: [9.99, 56.03, 10.36, 56.33] } };

const wfsUrl = (base, typeNames, bbox, propertyName, count) => {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  return `${base}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames, outputFormat: "application/json", srsName: "EPSG:4326",
    count: String(count), ...(propertyName && { propertyName }), bbox: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326` })}`;
};
// The city's WFS: one try, a short limit (the review of 24. 11. 2026: through gis.js getJSON a hanging server held every
// Copenhagen cut up to 25 s and more with its retries): the buildings 6 s a facade, the kerb lines and parking areas 8 s.
const TIMEOUT = 6000, LINES_TIMEOUT = 8000;
const askCity = (url, ms) => fetch(url, { signal: AbortSignal.timeout(ms) }).then((r) => { if (!r.ok) throw new Error(`${new URL(url).hostname} ${r.status}`); return r.json(); });
const centreOf = (bbox) => { const [x0, y0, x1, y1] = bbox.split(",").map(Number); return [(x0 + x1) / 2, (y0 + y1) / 2]; };

// ---------- Copenhagen's kerb lines ----------
// The edges of roadways and of cycle tracks along a road (the edges of paths, drives and internal roads are left out).
export const KANT = new Set(["Kørevej", "Cykelsti langs vej"]);
export const kantPaths = (json) => (json?.features || []).filter((f) => KANT.has(f.properties?.vejtype)).flatMap((f) => pathsOf(f.geometry));
export const kantUrl = (bbox) => wfsUrl(KBH_WFS, "k101:vejkant", bbox, "vejtype,wkb_geometry", 2000);
// A failure is not kept (the review of 24. 11. 2026: one WFS hiccup left every later cut at that place without the lines
// and said nothing): the next cut asks again, and this one tells the visitor (dkFailed, app.js).
const memo = new Map();
function kanter(bbox) {
  if (!memo.has(bbox)) {
    if (memo.size > 30) memo.delete(memo.keys().next().value);
    memo.set(bbox, askCity(kantUrl(bbox), LINES_TIMEOUT).then(kantPaths).catch((err) => { memo.delete(bbox); throw err; }));
  }
  return memo.get(bbox);
}
async function lines(bbox) {
  if (!bbox) return { features: [] };
  if (!on("kbhkant") || !inArea(AREAS.kobenhavn, ...centreOf(bbox))) return { features: [], edges: [], symbols: [], widths: [], areas: [] };
  const edges = await kanter(bbox).catch((err) => { console.warn("Kodaň vejkant", err.message); return null; });
  if (!edges) return { features: [], edges: [], symbols: [], widths: [], areas: [], dkFailed: "kant" };
  return { features: [], edges, edgesFrom: edges.length ? "kbh-vejkant" : null, symbols: [], widths: [], areas: [] };
}

// ---------- Copenhagen's parking areas ----------
// The kind of the stalls (p_type): "Afmærket/Uafmærket skråparkering, 90°" perpendicular, 30–75° angled; plain
// "(U)afmærket parkering" leaves the orientation to the area's length and count (derive.js). A stall of a scheme of its
// own (p_ordning: the disabled, car sharing, embassies, motorcycles, taxis, coaches) is reserved; paid zones, charging
// places and free parking are common parking (as Amsterdam's charging spaces).
const RESERVED = /handicap|delebil|ambassade|motorcykel|taxi|turistbus/i;
export function parkingOrient(type) {
  const m = /skråparkering,\s*(\d+)/i.exec(String(type || ""));
  if (!m) return undefined;
  return Number(m[1]) >= 85 ? "kolme" : "sikme";
}
// A polygon without a record (no kind, no count, no street) stays parking: in the A/B of 24. 11. 2026 cars stood on
// one (Nordbanegade), leaving them out made it worse.
export function kbhParking(json) {
  return {
    features: (json?.features || []).flatMap((f) => {
      const p = f.properties || {};
      const orient = parkingOrient(p.p_type);
      return polygonsOf(f.geometry).map((rings) => ({ attributes: { KIND: RESERVED.test(p.p_ordning || "") ? "specialni" : "useky",
        PS_ZPS: Number(p.antal_p_pladser) > 0 ? Number(p.antal_p_pladser) : 1, ...(orient && { ORIENT: orient }) }, geometry: { rings } }));
    }),
  };
}
export const parkingUrl = (bbox) => wfsUrl(KBH_WFS, "k101:parkering_areal", bbox, "p_type,p_ordning,antal_p_pladser,wkb_geometry", 1000);
// Not answering: no parking areas (the estimate as where the city has none), said so (dkFailed).
async function parking(bbox) {
  if (!on("kbhpark") || !inArea(AREAS.kobenhavn, ...centreOf(bbox))) return { features: [] };
  const json = await askCity(parkingUrl(bbox), LINES_TIMEOUT).catch((err) => { console.warn("Kodaň parkering", err.message); return null; });
  if (!json) return { features: [], dkFailed: "park" };
  return { ...kbhParking(json), dkParking: true };
}

// ---------- buildings ----------
const num = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));
const yearOf = (v) => { const y = num(v); return y > 1100 && y <= new Date().getFullYear() + 2 ? y : undefined; };
// BBR's walls (ydervæggens materiale): 1 brick, 2 light concrete blocks, 3 and 10 fibre cement, 4 half-timbering,
// 5 wood, 6 concrete elements, 8 metal, 11 plastic, 12 glass. Brick, blocks, half-timbering and wood are solid (no
// panel house; Denmark has none of the socialist looks anyway). Half-timbering is no painted wooden house: no material.
const WALLS = { 1: "brick", 2: "brick", 5: "wood", 6: "concrete", 8: "metal", 12: "glass" };
export function walls(code) {
  const c = num(code);
  return { ...(WALLS[c] && { material: WALLS[c] }), ...([1, 2, 4, 5].includes(c) && { solid: true }) };
}
// BBR's use (bygningens anvendelse, the codes of 2017 and the older ones alike): 110 a farmhouse, 120 and 122 a detached
// house, 121 and 130–132 terraced, semi-detached and linked houses, 140 a block of flats, 150–190 other dwellings, 210–290
// farming, industry and storage, 310–390 transport, offices, shops and hotels, 410–490 culture, schools, health, 510–590
// holiday houses, 910–990 garages, carports and sheds.
export function use(code) {
  const c = num(code);
  if (!(c >= 100)) return {};
  if (c === 110) return { house: true, farm: true, type: "house" };
  if (c === 120 || c === 122 || (c >= 510 && c < 520)) return { house: true, type: "house" };
  if (c === 121 || (c >= 130 && c < 140)) return { house: true, type: "terrace" };
  if (c >= 140 && c < 200) return { type: "apartments" };
  if (c >= 200 && c < 300) return { type: "industrial" };
  // Within 300–499 the kinds with looks of their own (the review of 24. 11. 2026: all of them were offices): 313 and 314
  // a parking house or garage building, 414 a church or other house of worship, 420–429 (and the old 420) a school or
  // university, 441 a day nursery; the rest (stations, offices, shops, hotels, culture, health) an office-like house.
  if (c === 313 || c === 314) return { garage: true };
  if (c === 414) return { type: "church" };
  if (c >= 420 && c < 430) return { office: true, type: c === 422 ? "university" : "school" };
  if (c === 441) return { office: true, type: "kindergarten" };
  if (c >= 300 && c < 500) return { office: true };
  if (c >= 900) return { garage: true };
  return {};
}
// Copenhagen's building: BBR's floors (antal etager: without the basement and the attic), the attic when it has an area,
// the year built; floors from the eaves height (about 3 m a floor) only where BBR has none.
export function kbhBuilding(p) {
  if (!p) return {};
  let n = num(p.antaletager), fromHeight = false;
  if (!(n >= 1 && n <= 60)) { const h = num(p.tagrendehoejde_estimat); n = h >= 2 ? Math.max(1, Math.round(h / 3)) : NaN; fromHeight = n >= 1; }
  const roof = num(p.samlettagetageareal) > 0 ? 1 : 0;
  return { built: yearOf(p.opfoerelselsaar), ...walls(p.ydervaeggensmaterialekode), ...use(p.bygningensanvendelsekode),
    ...(n >= 1 && n <= 60 && { cornice: n, roof, total: n + roof, ...(fromHeight && { fromHeight: true }) }) };
}
// Aarhus's building: no count of floors, only the areas; the floors as the total area (without the used attic) over the
// built-up area, an estimate (fromHeight: OSM's building:levels win, app.js).
export function aarBuilding(p) {
  if (!p) return {};
  const total = num(p.Byg_Arl_Saml), foot = num(p.Byg_Bebyg_Arl), attic = num(p.UdnyttetTagetageAreal) || 0;
  const n = foot > 0 && total > 0 ? Math.round((total - attic) / foot) : NaN;
  return { built: yearOf(p.Opfoerelse_Aar), ...walls(p.Ydervaeg_Kode), ...use(p.BygAnvendelseKode),
    ...(n >= 1 && n <= 40 && { cornice: n, roof: attic > 0 ? 1 : 0, total: n + (attic > 0 ? 1 : 0), fromHeight: true }) };
}
// The building whose outline holds the facade's point, else the one with the most floors touching the small box (a
// party wall); demolished or planned ones left out.
export function pick(json, lat, lon, read, floors) {
  const fs = (json?.features || []).filter((f) => !/nedrevet|projekteret|planlagt/i.test(String(f.properties?.bygningsstatus || "")));
  const here = fs.filter((f) => polygonsOf(f.geometry).some((rings) => inside(rings, lon, lat)));
  const f = (here.length ? here : fs).slice().sort((a, b) => (floors(b.properties) || 0) - (floors(a.properties) || 0))[0];
  return f ? read(f.properties) : {};
}
const ask = (url) => askCity(url, TIMEOUT);
const box = (lat, lon) => { const d = 0.00001, e = 0.00002; return `${(lon - e).toFixed(7)},${(lat - d).toFixed(7)},${(lon + e).toFixed(7)},${(lat + d).toFixed(7)}`; };
// Only the fields used (never the owner, the address or the cadastral number).
export const kbhBuildingUrl = (lat, lon) => wfsUrl(KBH_WFS, "k101:bygning", box(lat, lon),
  "bygningsstatus,opfoerelselsaar,antaletager,samlettagetageareal,tagrendehoejde_estimat,ydervaeggensmaterialekode,bygningensanvendelsekode,wkb_geometry", 5);
export const aarBuildingUrl = (lat, lon) => wfsUrl(AAR_WFS, "spatialsuite:geokodede_bbr_bygninger", box(lat, lon),
  "Opfoerelse_Aar,BygAnvendelseKode,Ydervaeg_Kode,Byg_Arl_Saml,Byg_Bebyg_Arl,UdnyttetTagetageAreal,SP_GEOMETRY", 5);
const houses = new Map();
async function podlaznost(lat, lon) {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)},${param("kbhbyg")},${param("aarbyg")}`;
  if (!houses.has(key)) {
    houses.set(key, (async () => {
      if (on("kbhbyg") && inArea(AREAS.kobenhavn, lon, lat)) {
        const p = pick(await ask(kbhBuildingUrl(lat, lon)), lat, lon, kbhBuilding, (q) => num(q?.antaletager));
        if (p.built || p.cornice) return { ...p, dkBuild: "kbh" };
      }
      if (on("aarbyg") && inArea(AREAS.aarhus, lon, lat)) {
        const p = pick(await ask(aarBuildingUrl(lat, lon)), lat, lon, aarBuilding, (q) => num(q?.Byg_Arl_Saml));
        if (p.built || p.cornice) return { ...p, dkBuild: "aar" };
      }
      return {};
    })().catch((err) => { houses.delete(key); throw err; }));
    if (houses.size > 30) houses.delete(houses.keys().next().value);
  }
  return houses.get(key);
}

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces: async () => ({ features: [], abroad: true }),
  lines,
  parking,
  podlaznost,
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: none (Copenhagen gives the kerb lines and parking areas, no surfaces; Aarhus its buildings).
export const SURFACE_MAPS = [];
