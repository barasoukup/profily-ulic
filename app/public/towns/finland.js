// Finland (Bára 23. 11. 2026): the state of a cut inside states.json's "finland" (with Åland). There is no national
// orthophoto without a key (evaluation/finland/SOURCES.md 1): the profile is the estimate from OSM, with the town's own
// orthophoto in Helsinki, Espoo and Turku (lanes-ortho.js "fi"). Its own sources:
// - Helsinki's register of public areas YLRE (Yleisten alueiden rekisteri, kartta.hel.fi WFS, CORS *, CC BY 4.0 on HRI
//   "Helsingin kaupunki"): the parts of the streets (roadway, sidewalk, separated cycle track, island, divider, lawn,
//   planting, parking area) as surfaces of the cut, as Tallinn's map: the city's building outlines and OSM's buildings
//   before it, OSM's green and water after, only inside the city's border (finland-helsinki.js) and where the register
//   has the street under the cut's centre (hasStreet, after the hostile review of 24. 11. 2026 as in Vilnius: within
//   3 m a roadway under a street for cars, a roadway, sidewalk or cycle track under a path; the register covers only
//   the streets the city keeps, not yards); a register that does not answer: the estimate, with a note. ?helsinki=0
//   leaves it out. Only the fields used are asked (the records name the clerk who last changed them).
// - the city's building outlines (Rakennukset_alue_rekisteritiedot, same WFS and licence) before OSM's under the
//   register: the register's sidewalks end at the city's own outlines, OSM's lie a metre or two off and left strips of
//   "plocha (odhad)" at the facades (the review, bod 6); ?hkihouses=0 leaves them out.
// - the buildings: in Helsinki the city's building register (Rakennukset_alue_rekisteritiedot, same WFS and licence:
//   floors, the year completed, walls and facade, use), ?hkibuild=0; elsewhere (and where Helsinki's has no house) the
//   national buildings of Ryhti (SYKE, open_building: points with floors, the year, walls, facade, use; CORS *, CC BY
//   4.0), the point inside the OSM building at the facade, ?ryhti=0. One small request a facade on a click, at most 6 s,
//   kept by the point rounded to about a metre.
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { osmAreas } from "./slovakia.js";
import { HELSINKI_RINGS } from "./finland-helsinki.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_FI?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const HEL_WFS = "https://kartta.hel.fi/ws/geoserver/avoindata/wfs";
const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
// Helsinki: its box and its border with its waters (the city's districts; the box alone took parts of Espoo and Vantaa,
// where the register is empty: a request for nothing and, when Helsinki did not answer, a note about its map there).
const ringsBox = (rings) => { const p = rings.flat(); return [Math.min(...p.map((q) => q[0])), Math.min(...p.map((q) => q[1])), Math.max(...p.map((q) => q[0])), Math.max(...p.map((q) => q[1]))]; };
export const AREAS = { helsinki: { box: ringsBox(HELSINKI_RINGS) } };
export const inHelsinki = (lon, lat) => inArea(AREAS.helsinki, lon, lat) && inRings(HELSINKI_RINGS, lon, lat);

// ---------- YLRE: the parts of Helsinki's streets ----------
// The register's kinds (paatyyppi / alatyyppi, counted over four districts, SOURCES.md 2) → MTVU codes (city.js
// MTVU_LABELS). A bridge's parts ("Ajorata (Silta)") are the same parts. Furniture, walls, gutters, steps' cheeks and
// play areas are left to what lies under them (OSM). A divider (Erotusalue) is paved unless its material is grass.
// After the hostile review (24. 11. 2026, bod 9): a square (Aukiot) is paving, not a sidewalk (as in Vilnius); a
// driveway across the sidewalk (Tonttiliittymä) is the sidewalk it crosses; a cycling area or lane (Pyöräilyalue/kaista)
// in a street (alueen_kayttotarkoitus …katu: Konalantie, Pohjoisranta, a red lane at the kerb) is the roadway's, and
// the cycle lane comes from OSM as on any roadway; on a square or in a park it is a cycle track. A combined footway and
// cycleway stays a sidewalk (OSM tells the shared path).
const SUB = {
  "Ajorata": 701, "Ajorata, muu": 701, "Tonttiliittymä": 702, "Koroke": 1003, "Pysäköintialue": 704,
  "Jalankulkualue": 702, "Erotettu jalkakäytävä": 702, "Yhdistetty jk ja pp": 702, "Puistokäytävät": 702, "Aukiot": 1003,
  "Kevyt liikenne": 702, "Portaat": 702, "Lämmitettävät portaat": 702, "Polku": 702, "Pelastusreitit": 702, "Juuristoritilä": 702,
  "Erotettu pyörätie": 703, "Pyöräilyalue/kaista": 703,
  "Erotusalue": 1003, "Muu katutilan osa": 1003, "Muu alue": 1003,
  "Avokallio": 402, "Metsä": 200, "Niityt": 401, "Joki/puro": 501, "Oja, ojanne": 501,
  "Leikkikenttä": 901, "Pelikenttä": 901, "Skeittikenttä": 901, "Koiranulkoilualue": 901,
};
const GREEN_MAIN = new Set(["Nurmikot ja niityt", "Puut, pensaat ja köynnökset", "Kukkakasvit"]);
export function ylreCode(p) {
  const sub = String(p?.alatyyppi || "").replace(/\s*\(Silta\)$/, "").trim();
  if (GREEN_MAIN.has(p?.paatyyppi) || sub === "Istutusallas") return 401;
  if (sub === "Erotusalue" && /nurmi|istutus|kasvi/i.test(String(p?.materiaali || ""))) return 401;
  if (sub === "Pyöräilyalue/kaista" && /katu/i.test(String(p?.alueen_kayttotarkoitus || ""))) return 701;
  return SUB[sub] ?? null;
}
// The combined footway and cycleway is drawn over other parts in places (a route): it yields to them.
const LAST = new Set(["Yhdistetty jk ja pp"]);
export function ylreFeatures(json) {
  const out = [], late = [];
  for (const f of json?.features || []) {
    const code = ylreCode(f.properties), g = f.geometry;
    if (!code) continue;
    const sub = String(f.properties?.alatyyppi || "").replace(/\s*\(Silta\)$/, "");
    for (const p of g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []) (LAST.has(sub) ? late : out).push({ attributes: { code }, geometry: { rings: p } });
  }
  return { features: [...out, ...late] };
}
export const ylreUrl = (bbox) => {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  return `${HEL_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "avoindata:YLRE_Katu_ja_viherosat_kaikki_alue",
    outputFormat: "application/json", srsName: "EPSG:4326", count: "3000", propertyName: "paatyyppi,alatyyppi,materiaali,alueen_kayttotarkoitus,geom",
    bbox: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326` })}`;
};
const memo = new Map();
function cached(bbox) {
  const key = bbox.split(",").map((v) => (+v).toFixed(4)).join(",");
  if (!memo.has(key)) {
    memo.set(key, getJSON(ylreUrl(bbox)).then(ylreFeatures).catch((err) => { memo.delete(key); throw err; }));
    if (memo.size > 30) memo.delete(memo.keys().next().value);
  }
  return memo.get(key);
}
// The register has the street when a part of its kind lies under the cut's centre (within 3 m): a roadway under a
// street for cars, a roadway, sidewalk or cycle track under a footway, path or cycleway (the hostile review of
// 24. 11. 2026, bod 1: the old rule, a roadway or sidewalk within 15 m, took the register 29 m beside a park path and
// for cuts where none of its parts came into the profile).
const AROUND = [[0, 0], ...Array.from({ length: 12 }, (_, i) => [3 * Math.cos((i * Math.PI) / 6), 3 * Math.sin((i * Math.PI) / 6)])];
const WALKED = new Set(["footway", "path", "pedestrian", "cycleway", "steps", "bridleway", "corridor"]);
export function hasStreet(features, cx, cy, tags = null) {
  const my = 1 / 110574, mx = 1 / (111320 * Math.cos((cy * Math.PI) / 180));
  const kinds = !tags?.highway || WALKED.has(tags.highway) ? [701, 702, 703] : [701];
  return features.some((f) => kinds.includes(f.attributes.CTVUK_KOD) && AROUND.some(([ox, oy]) => inRings(f.geometry.rings, cx + ox * mx, cy + oy * my)));
}
// The city's building outlines of the cut (as surfaces, before OSM's), or none (switched off, or no answer: OSM's alone).
export const hkiHousesUrl = (bbox) => {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  return `${HEL_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "avoindata:Rakennukset_alue_rekisteritiedot",
    outputFormat: "application/json", srsName: "EPSG:4326", count: "500", propertyName: "tila,geom", bbox: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326` })}`;
};
export function hkiHouseFeatures(json) {
  const out = [];
  for (const f of json?.features || []) {
    if (f.properties?.tila && f.properties.tila !== "voimassa") continue;
    for (const rings of ringsOf(f.geometry)) out.push({ attributes: { CTVUK_KOD: 601, CTVUK_POPIS: MTVU_LABELS[601], ODHAD: 0 }, geometry: { rings } });
  }
  return out;
}
const houseMemo = new Map();
async function hkiHouses(bbox) {
  if (param("hkihouses") === "0") return [];
  const key = bbox.split(",").map((v) => (+v).toFixed(4)).join(",");
  if (!houseMemo.has(key)) {
    houseMemo.set(key, getJSON(hkiHousesUrl(bbox)).then(hkiHouseFeatures).catch((err) => { houseMemo.delete(key); console.warn("Helsinki buildings", err); return []; }));
    if (houseMemo.size > 30) houseMemo.delete(houseMemo.keys().next().value);
  }
  return houseMemo.get(key);
}
async function surfaces(bbox, tags = null) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (param("helsinki") === "0" || !inHelsinki(cx, cy)) return { features: [], abroad: true };
  let own;
  try {
    own = asMtvu([[await cached(bbox), (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, fiFailed: "helsinki" };
  }
  if (!hasStreet(own.features, cx, cy, tags)) return { features: [], abroad: true };
  const [o, h] = await Promise.all([osmAreas(bbox), hkiHouses(bbox)]);
  return { features: [...h, ...o.buildings, ...asPassport(own).features, ...o.rest], fiTown: "helsinki", passport: true };
}

// ---------- buildings ----------
const num = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));
const yearOf = (v) => { const y = parseInt(String(v || "").slice(0, 4), 10); return y > 1100 && y <= new Date().getFullYear() + 2 ? y : undefined; };
const code2 = (v) => String(v ?? "").replace(/^.*\/code\//, "").padStart(2, "0");
// The walls (kantava rakennusaine: 01 concrete, 02 brick, 03 steel, 04 wood) and the facade (julkisivu: 01 concrete,
// 02 brick, 03 sheet metal, 04 stone, 05 wood, 06 glass); the codelists of rytj on koodistot.suomi.fi (checked
// 23. 11. 2026), Helsinki's register with the same numbers without the leading zero. A wooden house is "wood" for the
// look (house-looks.js); brick, stone or wood is solid (not a panel house).
function walls(load, facade) {
  const l = code2(load), f = code2(facade);
  const wood = l === "04" || f === "05";
  return { ...(wood && { material: "wood" }), ...((wood || l === "02" || f === "02" || f === "04") && { solid: true }) };
}
// Helsinki's register: the floors (i_kerrlkm), the year completed (c_valmpvm), the walls (c_rakeaine) and facade
// (c_julkisivu), the use by the classification of 1994 (c_kayttark: 011–013 detached houses, 021–022 terraced, 032–039
// blocks of flats, 121–124 hotels, 151 offices, 2xx–5xx care, assembly and schools, 6xx–7xx industry and storage).
// Ryhti's open classification has only "07 public building" (school, church, hospital, office of the state alike) and
// "02 offices, production and other": 07 stays an office, 02 says nothing (checked on koodistot.suomi.fi 24. 11. 2026).
export function hkiBuilding(p) {
  if (!p) return {};
  const n = num(p.i_kerrlkm), floors = n >= 1 && n <= 60 ? n : undefined, use = String(p.c_kayttark || "");
  // 341 churches and chapels, 51x–54x schools (the review of 24. 11. 2026, bod 14: else drawn as offices).
  const type = /^01/.test(use) ? "house" : /^02/.test(use) ? "terrace" : /^03/.test(use) ? "apartments" : /^[67]/.test(use) ? "industrial"
    : /^341/.test(use) ? "church" : /^5[1-4]/.test(use) ? "school" : undefined;
  const office = /^(12|15|[2-5])/.test(use) || undefined;
  return { built: yearOf(p.c_valmpvm), ...walls(p.c_rakeaine, p.c_julkisivu), ...(type === "house" && { house: true }), type, office, ...(floors && { cornice: floors, total: floors, roof: 0 }) };
}
// Ryhti's open building: number_of_storeys, completion_date, the walls and facade (codes as above), main_purpose by the
// open classification (05 small house, 06 block of flats, 07 public building; the others say little), not demolished.
export function ryhtiBuilding(p) {
  if (!p) return {};
  const n = num(p.number_of_storeys), floors = n >= 1 && n <= 60 ? n : undefined, use = code2(p.main_purpose);
  return { built: yearOf(p.completion_date), ...walls(p.material_of_load_bearing_structures, p.facade_material), ...(use === "05" && { house: true, type: "house" }),
    ...(use === "06" && { type: "apartments" }), ...(use === "07" && { office: true }), ...(floors && { cornice: floors, total: floors, roof: 0 }) };
}
const ringsOf = (g) => (g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []);
// Helsinki: the building whose outline holds the point, else the tallest touching the box (a party wall).
export function hkiPick(json, lat, lon) {
  const fs = (json?.features || []).filter((f) => !f.properties?.tila || f.properties.tila === "voimassa");
  const here = fs.filter((f) => ringsOf(f.geometry).some((rings) => inRings(rings, lon, lat)));
  const f = (here.length ? here : fs).slice().sort((a, b) => (num(b.properties?.i_kerrlkm) || 0) - (num(a.properties?.i_kerrlkm) || 0))[0];
  return f ? { ...hkiBuilding(f.properties), fiBuild: "hki" } : {};
}
// Ryhti: of the points not demolished, those inside the OSM building at the facade (rings in lon, lat), the nearest to
// the facade's point; without an outline the nearest within NEAR m.
const NEAR = 8;
export function ryhtiPick(json, lat, lon, outline = null) {
  const mx = 111320 * Math.cos((lat * Math.PI) / 180), my = 110574;
  const pts = (json?.features || []).filter((f) => f.geometry?.type === "Point" && !f.properties?.demolition_date)
    .map((f) => ({ f, d: Math.hypot((f.geometry.coordinates[0] - lon) * mx, (f.geometry.coordinates[1] - lat) * my) }));
  const cand = outline ? pts.filter((x) => inRings(outline, ...x.f.geometry.coordinates)) : pts.filter((x) => x.d <= NEAR);
  const best = cand.sort((a, b) => a.d - b.d)[0];
  return best ? { ...ryhtiBuilding(best.f.properties), fiBuild: "ryhti" } : {};
}
const TIMEOUT = 6000;
export const ask = (url) => fetch(url, { signal: AbortSignal.timeout(TIMEOUT) }).then((r) => { if (!r.ok) throw new Error(`${new URL(url).hostname} ${r.status}`); return r.json(); });
const box = (lat, lon, dLat, dLon) => `${(lat - dLat).toFixed(7)},${(lon - dLon).toFixed(7)},${(lat + dLat).toFixed(7)},${(lon + dLon).toFixed(7)},urn:ogc:def:crs:EPSG::4326`;
export const hkiBuildingUrl = (lat, lon) => `${HEL_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "avoindata:Rakennukset_alue_rekisteritiedot",
  outputFormat: "application/json", srsName: "EPSG:4326", count: "5", propertyName: "tila,i_kerrlkm,c_valmpvm,c_rakeaine,c_julkisivu,c_kayttark,geom", bbox: box(lat, lon, 0.00001, 0.00002) })}`;
export const RYHTI_WFS = "https://paikkatiedot.ymparisto.fi/geoserver/ryhti_building/wfs";
export const ryhtiUrl = (lat0, lon0, lat1, lon1) => `${RYHTI_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "ryhti_building:open_building",
  outputFormat: "application/json", srsName: "EPSG:4326", count: "50",
  propertyName: "number_of_storeys,completion_date,main_purpose,facade_material,material_of_load_bearing_structures,demolition_date,point_location_geometry_data",
  bbox: `${lat0.toFixed(7)},${lon0.toFixed(7)},${lat1.toFixed(7)},${lon1.toFixed(7)},urn:ogc:def:crs:EPSG::4326` })}`;
// The OSM building (the outer ring and holes in lon, lat) holding the point, from the tiles the cut has loaded anyway.
async function osmOutline(lat, lon) {
  const o = await osmTiles(lat, lon, 40).catch(() => null);
  for (const el of o?.elements || []) {
    if (el.type !== "area" || !el.geometry || !el.tags?.building || el.tags.building === "no") continue;
    const rings = [el.geometry, ...(el.holes || [])].map((g) => g.map((p) => [p.lon, p.lat]));
    if (inRings(rings, lon, lat)) return rings;
  }
  return null;
}
// Ryhti's building for the facade's point, inside the OSM outline (null: none found; then the nearest within NEAR m).
export async function ryhtiAt(lat, lon, outline) {
  let b;
  if (outline) {
    const xs = outline[0].map((p) => p[0]), ys = outline[0].map((p) => p[1]);
    // A big outline (a block) is asked only around the facade's point (Ryhti answers 3000 points at most).
    const dLat = 60 / 110574, dLon = 60 / (111320 * Math.cos((lat * Math.PI) / 180));
    b = [Math.max(Math.min(...ys), lat - dLat), Math.max(Math.min(...xs), lon - dLon), Math.min(Math.max(...ys), lat + dLat), Math.min(Math.max(...xs), lon + dLon)];
  } else {
    const dLat = NEAR / 110574, dLon = NEAR / (111320 * Math.cos((lat * Math.PI) / 180));
    b = [lat - dLat, lon - dLon, lat + dLat, lon + dLon];
  }
  return ryhtiPick(await ask(ryhtiUrl(...b)), lat, lon, outline);
}
const houses = new Map();
async function podlaznost(lat, lon) {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)},${param("hkibuild")},${param("ryhti")}`;
  if (!houses.has(key)) {
    houses.set(key, (async () => {
      if (param("hkibuild") !== "0" && inHelsinki(lon, lat)) {
        const p = await ask(hkiBuildingUrl(lat, lon)).then((j) => hkiPick(j, lat, lon)).catch(() => ({}));
        if (p.fiBuild) return p;
      }
      return param("ryhti") === "0" ? {} : ryhtiAt(lat, lon, await osmOutline(lat, lon));
    })().catch((err) => { houses.delete(key); throw err; }));
    if (houses.size > 30) houses.delete(houses.keys().next().value);
  }
  return houses.get(key);
}

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces,
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost,
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: Helsinki's register of public areas.
export const SURFACE_MAPS = ["helsinki"];
