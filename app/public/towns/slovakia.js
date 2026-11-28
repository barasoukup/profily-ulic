// Outside the Czech Republic (Bára 15. 11. 2026): Slovakia, and the margins of the OSM extracts beyond the borders
// ("cizina"). Only the OSM tiles are read: the technical map of ČÚZK (DMVS) and RÚIAN cover the Czech Republic only
// (the DMVS answers outside it without CORS, which looked like an outage), so they are not asked at all. The surfaces
// are none, so the profile is the estimate from OSM and the orthophoto (app.js, ortho-osm.js). The houses of
// Slovakia: ZBGIS of ÚGKK SR (layer Budova, CC BY 4.0, GKÚ Bratislava) gives the use and the height above the ground,
// no floors and no year: the floors are the height by 3.3 m; elsewhere abroad OSM's building:levels.
import { osmTiles, query, envelope, asMtvu, addPoints, boxAround } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { tmapyWfs } from "./overlay.js";
import { GREEN as OSM_GREEN, WATER as OSM_WATER } from "../ortho-osm.js";

export const ZBGIS_BUILDINGS = "https://zbgis.skgeodesy.sk/zbgis/rest/services/ZBGIS/MapServer";
const FLOOR = 3.3; // m of height per floor (the height runs to the top of the roof)
// Uses read as a hall (IPR typ 3), as a small low building (typ 6), as a family house (a pitched roof, profile.js).
const HALL = new Set(["Výrobná, technologická budova", "Sklad", "Poľnohospodárska budova", "Depo", "Hangár", "Autoservis", "Senník",
  "Zariadenie na železnici na uskladnenie/opravu", "Údržbárska dielňa pre lietadlá", "Športová hala, telocvičňa", "Zimný štadión", "Nákupné stredisko", "Tržnica"]);
const LOW = new Set(["Garáž", "Spoločné garáže", "Šopa, kôlňa", "Transformovňa", "Skleník", "Chata", "Poľovnícka chata", "Kontrolná budova, vrátnica"]);
const HOUSE = new Set(["Rodinný dom", "Chata", "Fara, farská budova"]);
// Where people live: the panel house look fits these only (Bára 16. 11. 2026); any other known use is drawn as an
// office or a public building (profile.js OFFICE_TYPES), hotels and schools alike.
const RESIDENTIAL = new Set(["Bytový dom", "Ubytovňa, penzión", "Domov dôchodcov", "Detský domov", "Kláštor", "Kňažský seminár"]);
const OFFICE = new Set(["Administratívna budova", "Banka", "Budova štátnej alebo verejnej správy", "Mestský, obecný úrad", "Správna a súdna budova", "Radnica", "Veľvyslanectvo, konzulát"]);
// An OSM building type for the use (profile.js reads info.type).
export const zbgisType = (use) => !use || use === "Neznámy" || HOUSE.has(use) ? undefined : RESIDENTIAL.has(use) ? "apartments"
  : HALL.has(use) || LOW.has(use) ? undefined : OFFICE.has(use) ? "office" : "commercial";

// The building of ZBGIS at a point (a facade of the cut), as RÚIAN's (gis.js ruianBuilding) for profile.js: identify
// within about half a metre (ZBGIS answers its query operation with 503).
export function zbgisBuilding(json) {
  const a = (json?.results || []).find((r) => r.layerId === 41)?.attributes;
  if (!a) return {};
  const height = parseFloat(String(a["Výška nad povrchom (m)"] ?? a.HGT ?? "").replace(",", "."));
  const use = a["Typ, účel využitia budovy"] ?? "";
  const area = parseFloat(String(a["Plocha (m²)"] ?? "").replace(",", "."));
  const floors = height > 0 ? Math.max(1, Math.round(height / FLOOR)) : undefined;
  return {
    cornice: floors, fromHeight: true, roof: 0, total: floors || 0, height: height > 0 ? height : undefined, use: use || undefined,
    kind: HALL.has(use) ? 3 : LOW.has(use) ? 6 : undefined, newBuild: false, area: area > 0 ? Math.round(area) : undefined,
    house: HOUSE.has(use) || undefined,
    type: zbgisType(use),
  };
}
async function podlaznost(lat, lon) {
  const d = 0.0004; // the map around the point: tolerance 3 px of 400 is about 0.6 m
  const q = new URLSearchParams({
    geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", sr: 4326, layers: "all:41", tolerance: 3,
    mapExtent: [lon - d, lat - d, lon + d, lat + d].join(","), imageDisplay: "400,400,96", returnGeometry: "false", f: "json",
  });
  const r = await fetch(`${ZBGIS_BUILDINGS}/identify?${q}`, { signal: AbortSignal.timeout(4000) });
  return r.ok ? zbgisBuilding(await r.json()) : {};
}

// ---------- the towns' road passports (Bára 16. 11. 2026: all the Slovak sources found, each with its A/B test) ----------
// Surfaces of the roads a town keeps, by the place of the cut: Bratislava (the city's passport of footways 2022,
// its roadways and car parks; the borough Dúbravka's own passport), Prešov (its passport of transport and of green,
// CC BY 4.0), Žilina and Banská Bystrica (T-MAPY PaKom, as Karviná). Around them the OSM buildings, green and water,
// as the estimate (ortho-osm.js) has them. Where a passport has nothing at the cut the profile is the estimate.
// ?pasport=0 leaves the passports out (the A/B test, evaluation/slovakia/AB.md).
const ROAD = 701, WALK = 702, BIKE = 703, PARK = 704, OTHER = 1003, GREEN = 401, PLAY = 901;
const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_SK?.[k] ?? null : new URLSearchParams(location.search).get(k));
const AGO_BA = "https://services8.arcgis.com/pRlN1m0su5BYaFAS/arcgis/rest/services";
// The magistrát's passport and the city's technical map lie 1.4–1.5 m east and 0.3 m south of OSM, the cadastre's
// buildings and the ZBGIS orthophoto (Bára 19. 11. 2026: the
// hold-out set put the estimate's streets 1.2 m off it, in Bratislava only; evaluation/slovakia/shift-ba.mjs, 1330 points
// on OSM's axes in the centre, the rest 0.3 m): moved back.
const BA_SHIFT = { east: -1.47, north: 0.33 };
function shiftBa(json) {
  if (!json?.features) return json;
  const dLon = BA_SHIFT.east / (111320 * Math.cos((48.15 * Math.PI) / 180)), dLat = BA_SHIFT.north / 110574;
  const mv = ([x, y, ...z]) => [x + dLon, y + dLat, ...z], g = (geo) => geo && {
    ...geo, ...(geo.rings && { rings: geo.rings.map((r) => r.map(mv)) }), ...(geo.paths && { paths: geo.paths.map((r) => r.map(mv)) }),
    ...(Number.isFinite(geo.x) && { x: geo.x + dLon, y: geo.y + dLat }) };
  return { ...json, features: json.features.map((f) => (f.geometry ? { ...f, geometry: g(f.geometry) } : f)) };
}
const AGO_DUBRAVKA = "https://services-eu1.arcgis.com/sF2W5owmzDfZHYpi/arcgis/rest/services";
const AGO_PRESOV = "https://services-eu1.arcgis.com/coW662rcZatH0tHA/arcgis/rest/services";
const arc = (url, fields, bbox) => query(`${encodeURI(url)}/query`, { ...envelope(bbox), outFields: fields, returnGeometry: "true" });
// Bratislava, the passport of footways: its uses → MTVU codes (stairs, underpasses and the rest left to others).
const BA_WALK = { Chodník: WALK, "Chodník v parku": WALK, Námestie: WALK, Lávka: WALK, Rampa: WALK, Vstup: WALK, Vjazd: WALK, "Zastávka MHD": WALK,
  "Bike parking": WALK, "Chodník so zlúčeným pohybom cyklistov a chodcov": BIKE, Cyklochodník: BIKE, "Segregovaná cyklotrasa": BIKE,
  Parkovanie: PARK, "Státie pre vozidlá údržby": PARK, Iné: OTHER };
const DUBRAVKA = { cesta: ROAD, "autobusová nika": ROAD, "autobusová zastávka": ROAD, chodník: WALK, námestie: WALK, vjazd: WALK, parkovisko: PARK,
  "spevnená plocha": OTHER, "kontajnerové stojisko": OTHER, ihrisko: PLAY };
// T-MAPY PaKom in Slovak.
const PAKOM = { vozovka: ROAD, chodník: WALK, parkovisko: PARK, cyklotrasa: BIKE, ostatné: OTHER };
const pakom = (base) => async (bbox) => asMtvu([[await tmapyWfs(base, "ms:pk-pov", bbox, "typ,msGeometry"), (a) => PAKOM[a.typ] ?? null]], MTVU_LABELS);
export const SK_TOWNS = {
  // Dúbravka first: where both have a surface, the borough's (newer, with roadways) wins.
  bratislava: { box: [16.83, 47.99, 17.33, 48.27], credit: "pasport komunikácií © Hlavné mesto SR Bratislava a MČ Dúbravka, © EUROSENSE SLOVAKIA, s.r.o.",
    async own(bbox) {
      const [x0, y0, x1, y1] = bbox.split(",").map(Number);
      const dub = x1 > 16.98 && x0 < 17.07 && y1 > 48.165 && y0 < 48.215;
      const [d, walk, road, park] = await Promise.all([
        dub ? arc(`${AGO_DUBRAVKA}/Pasport_komunikácií_verejná/FeatureServer/0`, "Typ_kom", bbox).catch(() => null) : null,
        arc(`${AGO_BA}/Pasport_komunikácií_pre_peších_2022_view/FeatureServer/0`, "vyuzitie", bbox),
        arc(`${AGO_BA}/Vozovka_technický_stav_podľa_OSK_zobrazenie/FeatureServer/0`, "OBJECTID", bbox),
        arc(`${AGO_BA}/Parkoviská_OSK_MAG_BA_2_zobrazenie/FeatureServer/0`, "OBJECTID", bbox),
      ]);
      return asMtvu([[d, (a) => DUBRAVKA[a.Typ_kom] ?? null], [shiftBa(walk), (a) => BA_WALK[a.vyuzitie] ?? null], [shiftBa(road), ROAD], [shiftBa(park), PARK]], MTVU_LABELS);
    } },
  // Prešov closed its roadways, car parks and paved areas (vw_dp_*, ArcGIS 499 "Token Required", found 25. 11. 2026), and
  // sidewalks alone make no street, so no passport any more (Bára): its trees and the lines of its map (EDGE_SOURCES) stay.
  presov: { box: [21.15, 48.94, 21.33, 49.06],
    // The town's trees (dreviny) where OSM has none nearby.
    points: [[`${AGO_PRESOV}/Dreviny_-_pohľad/FeatureServer/12`, () => ({ natural: "tree" }), "FID"]] },
  zilina: { box: [18.62, 49.13, 18.86, 49.28], credit: "pasport komunikácií © mesto Žilina", own: pakom("https://gis.zilina.sk/services/mapserver/common/pakom") },
  bystrica: { box: [19.03, 48.66, 19.27, 48.82], credit: "pasport komunikácií © mesto Banská Bystrica", own: pakom("https://mapy.banskabystrica.sk/services/mapserver/common/pakom") },
  // Košice (the review of Slovakia, 16. 11. 2026): the same T-MAPY PaKom, so far mostly Košice-Západ; the city is
  // having the whole town surveyed.
  kosice: { box: [21.15, 48.64, 21.36, 48.79], credit: "pasport komunikácií © mesto Košice", own: pakom("https://gisplan.kosice.sk/services/mapserver/common/pakom") },
};
const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
// ---------- Bratislava's technical map ----------
// The city's digital technical map (geoportal.bratislava.sk, ArcGIS, CORS for our site; © Hlavné mesto SR Bratislava, no
// open licence stated) has lines and point symbols, no areas; its lines (edgesAt) place the kerbs. Its areas, found by
// closing the lines on a grid, lost (docs/decisions.md).
const BA_TM = "https://geoportal.bratislava.sk/hsite/rest/services/tm";
// The technical map lies as the passport does (1.44 m east, 0.25 m south of OSM's buildings from the cadastre;
// evaluation/slovakia/shift-ba-houses.mjs, shift-ba-tm.mjs: the passport matches it to 0.01 m): moved back the same way.
const baQuery = (svc, layer, bbox, fields) => query(`${BA_TM}/${encodeURI(svc)}/MapServer/${layer}/query`, { ...envelope(bbox), outFields: fields, returnGeometry: "true" }).then(shiftBa);
// Bratislava's technical map: the city's box (not cut to its boundary).
const inBa = (lon, lat) => inArea({ box: SK_TOWNS.bratislava.box }, lon, lat);

// By the town's box and, where towns-sk.json has it, its boundary (Bratislava's box reached Šamorín and Svätý Jur).
const townAt = (lon, lat) => Object.entries(SK_TOWNS).find(([id, t]) => inArea({ box: t.box, town: id }, lon, lat))?.[0] ?? null;

// The OSM areas around a box as MTVU features: buildings (they come first: a sidewalk may run under an arcade), and
// green and water (they come after the passport: they fill what it leaves open).
export async function osmAreas(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const lat = (y0 + y1) / 2, lon = (x0 + x1) / 2, r = Math.max((x1 - x0) * 111320 * Math.cos((lat * Math.PI) / 180), (y1 - y0) * 110574) / 2;
  const o = await osmTiles(lat, lon, r);
  const buildings = [], rest = [];
  for (const el of o.elements || []) {
    const t = el.tags || {};
    if (el.type !== "area" || !el.geometry) continue;
    const rings = [el.geometry, ...(el.holes || [])].map((g) => g.map((p) => [p.lon, p.lat]));
    const underground = Number(t.layer) < 0 || Number(t.level) < 0 || t.location === "underground";
    if (t.building && t.building !== "no" && t.building !== "roof" && !underground) buildings.push({ attributes: { CTVUK_KOD: 601, CTVUK_POPIS: MTVU_LABELS[601], ODHAD: 0 }, geometry: { rings } });
    else if (!t.building && (OSM_GREEN(t) || OSM_WATER(t))) {
      const c = OSM_GREEN(t) ? GREEN : ["allotments", "cemetery"].includes(t.landuse) ? 300 : 501;
      rest.push({ attributes: { CTVUK_KOD: c, CTVUK_POPIS: MTVU_LABELS[c], ODHAD: 1 }, geometry: { rings } });
    }
  }
  return { buildings, rest };
}

// The surfaces of a cut in Slovakia: a town's passport with the OSM areas around it, else none (the estimate).
// ---------- lines of the towns' maps for the kerbs (Bára 16. 11. 2026: "zapoj je všechny") ----------
// The drawing of the cadastral and technical maps the towns publish (ArcGIS Online, CORS *): where its lines cross the
// cut they are candidates for the kerbs and the outer edge of a sidewalk in the estimate (ortho-osm.js). Their types
// were looked at over the orthophoto (evaluation/slovakia/hrany): the kerbs and edges of sidewalks are in the
// drawing type 1 (Nitra, Piešťany, Prešov), 1 and 60 (Zvolen), "Kresba polohopisu" (Hlohovec), in Bratislava's
// technical map the boundaries of kinds of land. ?hrany=0 leaves them out (the A/B test).
const EDGE_SOURCES = [
  { id: "nitra", box: [18.0, 48.26, 18.17, 48.37], url: "https://services-eu1.arcgis.com/3EnLFR2iBNxznmDC/arcgis/rest/services/stavby/FeatureServer/0", field: "typ_ciary", keep: (v) => v === 1, credit: "kresba © mesto Nitra" },
  { id: "piestany", box: [17.78, 48.55, 17.88, 48.64], url: "https://services-eu1.arcgis.com/DTiFWvcjh8cdrOZ5/arcgis/rest/services/vnu_kre_par/FeatureServer/11", field: "TYP_CIARY", keep: (v) => v === 1, credit: "kresba © mesto Piešťany" },
  { id: "zvolen", box: [19.08, 48.54, 19.2, 48.62], url: "https://services-eu1.arcgis.com/qZQsmXf8mZtYtGaE/arcgis/rest/services/Kataster_12_v3/FeatureServer/1", field: "TYP_CIARY", keep: (v) => v === 1 || v === 60, credit: "kresba © mesto Zvolen" },
  { id: "hlohovec", box: [17.75, 48.39, 17.85, 48.46], url: "https://services6.arcgis.com/aDtTCbnvFGBaql6U/arcgis/rest/services/polohopis_24/FeatureServer/18", field: "Layer", keep: (v) => v === "Kresba polohopisu", credit: "polohopis © mesto Hlohovec" },
  { id: "presov", box: [21.15, 48.94, 21.33, 49.06], url: "https://services-eu1.arcgis.com/coW662rcZatH0tHA/arcgis/rest/services/Vrstva_hraníc_druhov_pozemkov/FeatureServer/52", field: "TYP_CIARY", keep: (v) => v === 1, credit: "hranice druhov pozemkov © mesto Prešov (CC BY 4.0)" },
];
const BA_EDGE = new Set([2180, 2190, 2200, 2201, 2210, 2211, 2220]);
// The symbols that tell the pieces beside a street (ortho-osm.js symbols): lawns and ornamental green, sidewalks,
// other paved areas, yards, car parks.
const BA_SYMBOL = { 3141: 401, 3140: 401, 3110: 401, 120: 702, 130: 1003, 4060: 603, 5370: 704 };
export const edgeSourceAt = (lon, lat) => EDGE_SOURCES.find((e) => inArea({ box: e.box, town: e.id }, lon, lat)) || null;
async function edgesAt(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (param("hrany") === "0") return { paths: [] };
  const e = edgeSourceAt(cx, cy);
  if (e) {
    const j = await arc(e.url, e.field, bbox).catch(() => null);
    return { paths: (j?.features || []).filter((f) => e.keep(f.attributes?.[e.field])).flatMap((f) => f.geometry?.paths || []), id: e.id };
  }
  if (inBa(cx, cy)) {
    // With its symbols of the kinds of areas (lawn, sidewalk, paved area, yard, car park): the pieces between the lines.
    const [j, p] = await Promise.all([baQuery("Technická_mapa_TM", 7, bbox, "Typ").catch(() => null), baQuery("Technická_mapa_TM", 9, bbox, "Typ").catch(() => null)]);
    // ?symboly=0 leaves the symbols out (the A/B test).
    const symbols = param("symboly") === "0" ? [] : (p?.features || []).map((f) => ({ x: f.geometry?.x, y: f.geometry?.y, code: BA_SYMBOL[f.attributes?.Typ] })).filter((q) => q.code && q.x !== undefined);
    return { paths: (j?.features || []).filter((f) => BA_EDGE.has(f.attributes?.Typ)).flatMap((f) => f.geometry?.paths || []), id: "bratislava-tm", symbols };
  }
  return { paths: [] };
}

// ---------- ZBGIS: the national map of Slovakia (Bára 16. 11. 2026) ----------
// Its roads are centre lines with their usable width ("Celková využiteľná šírka cesty v m"): the width of the
// carriageway in the estimate (ortho-osm.js widths). Its car parks, lawns and green areas (Parkovisko, Tráva, Úžitková
// zeleň) are surfaces beside the street, after the estimate's carriageway. One identify a box (its /query answers 503),
// once per box (the surfaces and the lines of a cut ask the same one). ?zbgis=0 leaves it out (the A/B test).
const ZBGIS_LAYERS = { 22: "cesta", 61: PARK, 70: GREEN, 78: GREEN };
const zbMemo = new Map();
export function zbgisParse(json) {
  const widths = [], features = [];
  for (const r of json?.results || []) {
    const kind = ZBGIS_LAYERS[r.layerId];
    if (kind === "cesta") {
      const w = parseFloat(String(r.attributes?.["Celková využiteľná šírka cesty v m"] ?? "").replace(",", "."));
      if (w > 0 && r.geometry?.paths) for (const path of r.geometry.paths) widths.push({ path, w });
    } else if (kind && r.geometry?.rings) features.push({ attributes: { CTVUK_KOD: kind, CTVUK_POPIS: MTVU_LABELS[kind], ODHAD: 0, ZBGIS: 1 }, geometry: r.geometry });
  }
  return { widths, features };
}
function zbgisAt(bbox) {
  if (param("zbgis") === "0") return Promise.resolve({ widths: [], features: [] });
  if (!zbMemo.has(bbox)) {
    zbMemo.clear();
    const [x0, y0, x1, y1] = bbox.split(",").map(Number);
    const q = new URLSearchParams({
      geometry: JSON.stringify({ xmin: x0, ymin: y0, xmax: x1, ymax: y1, spatialReference: { wkid: 4326 } }), geometryType: "esriGeometryEnvelope", sr: 4326,
      layers: `all:${Object.keys(ZBGIS_LAYERS).join(",")}`, tolerance: 0, mapExtent: bbox, imageDisplay: "800,800,96", returnGeometry: "true", f: "json",
    });
    zbMemo.set(bbox, fetch(`${ZBGIS_BUILDINGS}/identify?${q}`, { signal: AbortSignal.timeout(6000) }).then((r) => (r.ok ? r.json() : null)).then(zbgisParse).catch(() => ({ widths: [], features: [] })));
  }
  return zbMemo.get(bbox);
}

async function surfaces(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, d = 1.5 / 111320;
  const at = (f) => [[0, 0], [d, 0], [-d, 0], [0, d], [0, -d]].some(([dx, dy]) => inRings(f.geometry.rings, cx + dx, cy + dy));
  const id = param("pasport") === "0" ? null : townAt(cx, cy);
  const t = SK_TOWNS[id];
  // A passport that does not answer: the estimate, as where there is none (no outage to report).
  const [own, under] = await Promise.all([
    t?.own ? t.own(bbox).catch(() => ({ features: [] })) : { features: [] },
    t?.under ? t.under(bbox).catch(() => ({ features: [] })) : { features: [] },
  ]);
  // Only where the passport has a surface at the cut's centre (the street clicked): elsewhere
  // (a courtyard road, a car park aisle the town does not keep) its surfaces around would make a profile of nothing
  // (the A/B test of 16. 11. 2026: "Neurčeno" and green over the whole cut), so the estimate stays.
  if (!own.features.some(at) && !under.features.some(at)) {
    // No town's data at the cut: the estimate, with ZBGIS's car parks and lawns beside it (not one under the axis: a
    // lawn the street crosses on the map, a car park's aisle).
    // (ZBGIS's car parks and lawns go to the estimate itself, lines() areas: here they would stop it.)
    return { features: [], abroad: true };
  }
  const o = await osmAreas(bbox);
  // The passport, OSM's buildings before it, OSM's other areas last.
  return { features: [...o.buildings, ...own.features, ...under.features, ...o.rest], skTown: id, passport: true };
}
async function lines(bbox) {
  if (!bbox) return { features: [] };
  const [edges, zb] = await Promise.all([edgesAt(bbox), zbgisAt(bbox)]);
  return { features: [], edges: edges.paths, edgesFrom: edges.id, symbols: edges.symbols || [], widths: zb.widths, areas: zb.features };
}

// OSM around a point and, in a town that has them, its trees where OSM has none nearby.
async function osm(lat, lon, radius) {
  const id = param("pasport") === "0" ? null : townAt(lon, lat);
  const pts = SK_TOWNS[id]?.points;
  if (!pts) return osmTiles(lat, lon, radius);
  const box = boxAround(lat, lon, Math.min(radius, 50));
  const [o, ...got] = await Promise.all([osmTiles(lat, lon, radius), ...pts.map(([url, , field]) => arc(url, field || "OBJECTID", box).catch(() => ({ features: [] })))]);
  return addPoints(o, got, pts.map(([, tags]) => tags), id, lat);
}

export const sources = { osm, surfaces, lines, parking: async () => ({ features: [] }), podlaznost };

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The sources with a territory of their own (towns/index.js placeAt): the towns' passports, the lines of their maps,
// Bratislava's technical map.
export const AREAS = {
  ...Object.fromEntries(Object.entries(SK_TOWNS).map(([id, t]) => [`${id}-pasport`, { box: t.box, town: id }])),
  ...Object.fromEntries(EDGE_SOURCES.map((e) => [`${e.id}-kresba`, { box: e.box, town: e.id }])),
  "bratislava-tm": { box: SK_TOWNS.bratislava.box },
};

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: the towns' passports that are on by default (their AREAS, each town's boundary in towns-sk.json); the lines of
// the towns' maps (kresba) are no map of surfaces, Bratislava's technical map gives lines only.
export const SURFACE_MAPS = Object.entries(SK_TOWNS).filter(([, t]) => t.own).map(([id]) => `${id}-pasport`);
