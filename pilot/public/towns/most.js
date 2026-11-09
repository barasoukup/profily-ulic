// Most: the town's GIS (mapy.mesto-most.cz, ArcGIS) answers the browser directly (CORS): the object map of
// the ground (Objektová mapa povrchové situace, open data: the town's technical map turned into polygons,
// each with a class and a kind) for the surfaces, the drawing of the technical map (DTM/DtmUMPS) for track
// axes, fences, walls, railings, guard rails, hedges, trees and benches, and the street lamps of the
// town's passport (open data); floors of the buildings from RÚIAN of ČÚZK.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; see towns/jihlava.js) and app.js its base maps.
// The town's services turn S-JTSK into WGS 84 by S_JTSK_To_WGS_1984_1 (1623), as IPR and ČÚZK do: their
// building corners lie within 0.5 m of OSM's, so no datum parameter and no input shift are needed.
import { query, envelope, osmTiles, boxAround, asMtvu, addPoints, metres, ruianBuilding } from "../gis.js";
import { MTVU_LABELS } from "../city.js";

const MO = "https://mapy.mesto-most.cz/server/rest/services";
const MO_OMPS = `${MO}/Opendata/OpendataDtmOmps/FeatureServer/9/query`;
const MO_UMPS = `${MO}/DTM/DtmUMPS/MapServer`;
const MO_LAMPS = `${MO}/Opendata/OpendataPasport/FeatureServer/14/query`;
const none = () => ({ features: [] });

// Classes and kinds of the object map ("KOD_OMPS/KOD") → MTVU codes. The map covers the whole ground in
// the town, so nearly every kind has a code: small structures (cabinets, shafts, footings) are "other
// structures", a curb belongs to the sidewalk, a driveway across it too, a median strip is green.
const MO_CODES = {
  "3/12": 701, "3/40": 701, "4/29": 701, // silnice, křižovatka, železniční přejezd
  "3/18": 702, "3/19": 702, "3/35": 702, "3/14": 702, "2/18": 702, "2/21": 702, // chodník, vjezd, obrubník, nezpevněná cesta, schodiště, rampa
  "3/17": 704, "3/15": 401, "4/16": 705, "4/13": 1100,
  "6/3": 300, "8/6": 300, "8/9": 300, "12/42": 300, // zahrada, vinice, sad, chatová oblast
  "7/2": 603, "8/5": 100, "8/7": 401, "9/4": 200, "9/20": 200, "9/21": 200,
  "10/5": 401, "10/6": 401, "10/7": 401, "10/8": 401, "11/10": 401, "11/12": 401, "5/12": 401,
  "11/13": 402, "11/23": 402, "5/13": 402, "12/14": 402, // skála, příkop a násep, meliorace, hřbitov
  "11/1": 1003, "2/22": 1003, "12/15": 1003, "12/41": 1003, // manipulační plocha, terasa, lom, průmyslový areál
  "12/11": 901, "5/10": 901, "5/8": 502, "5/9": 502, "5/11": 501, "5/22": 501, "5/14": 503,
};
// Two kinds read by their width (under 1.5 m): a "surface structure" (2/26) is then the raised strip
// between a roadway and a tram bed or between two carriageways (a separating strip, not a wall), an
// "unpaved path" (3/14) the gravel shoulder of a country road (green as an estimate, not a sidewalk).
const NARROW = new Set(["2/26", "3/14"]);
const omps = (a) => {
  const key = `${a.KOD_OMPS}/${a.KOD}`;
  if (a.narrow) return key === "2/26" ? 401 : [401, true];
  return a.KOD_OMPS === 1 ? 601 : a.KOD_OMPS === 2 && !MO_CODES[key] ? 602 : MO_CODES[key] ?? null;
};
// Mean width of a polygon (2 × area / perimeter) in metres.
function width(geometry, lat) {
  const [kx, ky] = metres(lat);
  let area = 0, perimeter = 0;
  for (const r of geometry?.rings || []) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      area += (r[j][0] - r[i][0]) * kx * (r[j][1] + r[i][1]) * ky;
      perimeter += Math.hypot((r[j][0] - r[i][0]) * kx, (r[j][1] - r[i][1]) * ky);
    }
  }
  return perimeter ? Math.abs(area) / perimeter : 0;
}

async function surfaces(bbox) {
  const json = await query(MO_OMPS, { ...envelope(bbox), outFields: "KOD_OMPS,KOD" });
  const lat = Number(bbox.split(",")[1]);
  for (const f of json.features || []) {
    const a = f.attributes || {};
    if (NARROW.has(`${a.KOD_OMPS}/${a.KOD}`) && width(f.geometry, lat) < 1.5) a.narrow = true;
  }
  return asMtvu([[json, omps]], MTVU_LABELS);
}

// Lines of the technical map → the codes of IPR's line layer (derive.js FENCE_LINES, TECH_ITEM), without
// those drawn under the ground (PRUBEH_H 1). Track axes (Dopravní prvky liniové, kód 9 "osa kolejí") are
// kept as tram tracks (55010) only within 3 m of an OSM tram way: the same code marks the railway sidings.
const MO_STRUCT = { 7: 61210, 8: 61210, 9: 61210, 10: 61210, 11: 71210, 13: 61530, 14: 71210, 40: 61422 };
const TRAM_NEAR = 3;
async function lines(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const lat = (y0 + y1) / 2, lon = (x0 + x1) / 2;
  const [kx, ky] = metres(lat);
  const radius = Math.max((x1 - x0) * kx, (y1 - y0) * ky) / 2;
  const above = "(PRUBEH_H IS NULL OR PRUBEH_H <> 1)";
  const [built, transport, green, o] = await Promise.all([
    query(`${MO_UMPS}/43/query`, { ...envelope(bbox), outFields: "KOD", where: `KOD IN (${Object.keys(MO_STRUCT)}) AND ${above}` }),
    query(`${MO_UMPS}/46/query`, { ...envelope(bbox), outFields: "KOD", where: `KOD IN (9,10) AND ${above}` }),
    query(`${MO_UMPS}/55/query`, { ...envelope(bbox), outFields: "KOD", where: "KOD = 3" }).catch(none),
    osmTiles(lat, lon, radius).catch(() => ({ elements: [] })),
  ]);
  const trams = o.elements.filter((e) => e.tags?.railway === "tram" && e.geometry?.length > 1)
    .map((e) => e.geometry.map((g) => [g.lon * kx, g.lat * ky]));
  const dist = ([px, py], [ax, ay], [bx, by]) => {
    const l = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l));
    return Math.hypot(px - ax - t * (bx - ax), py - ay - t * (by - ay));
  };
  const nearTram = (path) => {
    const [x, y] = path[Math.floor(path.length / 2)], p = [x * kx, y * ky];
    return trams.some((w) => w.some((b, i) => i > 0 && dist(p, w[i - 1], b) < TRAM_NEAR));
  };
  const features = [];
  const add = (code, geometry) => features.push({ attributes: { CTMTP_KOD: code }, geometry });
  for (const f of built.features || []) if (f.geometry?.paths) add(MO_STRUCT[f.attributes.KOD], f.geometry);
  for (const f of green.features || []) if (f.geometry?.paths) add(81214, f.geometry);
  for (const f of transport.features || []) {
    if (!f.geometry?.paths) continue;
    if (f.attributes.KOD === 10) add(71522, f.geometry);
    else {
      const paths = f.geometry.paths.filter(nearTram);
      if (paths.length) add(55010, { paths });
    }
  }
  return { features };
}

// OSM around a point plus the town's trees, benches and street lamps where OSM has no such thing nearby.
// Each layer: its url, the fields and filter it needs, and the OSM tags of a feature (null: not drawn).
const MO_POINTS = [
  [`${MO_UMPS}/36/query`, "KOD", "KOD = 1", () => ({ natural: "tree" })],
  [`${MO_UMPS}/32/query`, "KOD", "KOD = 37 AND DRUH_MOB = 0", () => ({ amenity: "bench" })],
  [MO_LAMPS, "OBJECTID", "1=1", () => ({ highway: "street_lamp" })],
];
async function osm(lat, lon, radius) {
  const box = boxAround(lat, lon, radius);
  const [o, ...pts] = await Promise.all([
    osmTiles(lat, lon, radius),
    ...MO_POINTS.map(([url, outFields, where]) => query(url, { ...envelope(box), outFields, where }).catch(none)),
  ]);
  return addPoints(o, pts, MO_POINTS.map(([, , , tagsOf]) => tagsOf), "Most", lat);
}

// No layer of parking stalls: the town's GIS (all folders, 11/2026), its open data (data.gov.cz) and the
// technical map have no stalls, sections or paid zones (its "ZPS" layers are the základní prostorová
// situace, the inner drawing of traffic areas, DtmUMPS 48 kód 27, is a few hundred short lines, not
// stall markings). The parking areas of the object map (704, bays and car parks beside the roadway) and
// OSM's street_side parking areas are the parking; their depth tells the orientation (derive.js).
const parking = async () => ({ features: [] });

export const sources = { osm, surfaces, lines, parking, podlaznost: ruianBuilding };

// Base maps: the town's 2025 orthophoto (ČÚZK's, served by the town) and its technical map, drawn as
// export images in Web Mercator (the caches are in S-JTSK), with OSM underneath for the zoomed-out view.
// ctx: { L, ArcgisExport, BIG_TILES, osm (an OSM layer), cuzk (the ČÚZK orthophoto) } from app.js.
export function maps({ ArcgisExport, BIG_TILES, osm: osmLayer, cuzk }) {
  return {
    base: {
      "Ortofoto Most": [osmLayer(1), new ArcgisExport("", { service: `${MO}/Ortofoto/Ortofoto2025Cuzk/MapServer`, minZoom: 15, maxZoom: 21, ...BIG_TILES, attribution: "ortofoto © ČÚZK, Statutární město Most" })],
      "Technická mapa": [osmLayer(0.5), new ArcgisExport("", { service: MO_UMPS, minZoom: 17, maxZoom: 21, ...BIG_TILES, attribution: "technická mapa © Statutární město Most" })],
      "Ortofoto ČÚZK": [cuzk()],
      "OpenStreetMap": [osmLayer(1)],
    },
    default: "Ortofoto Most",
    lines: new ArcgisExport("", { service: MO_UMPS, maxZoom: 21, minZoom: 16, ...BIG_TILES, opacity: 0.9, attribution: "technická mapa © Statutární město Most" }),
  };
}

// The orthophoto for the evaluation (evaluation/run_brno.mjs): an ArcGIS export in Web Mercator.
export const ortho = { service: `${MO}/Ortofoto/Ortofoto2025Cuzk/MapServer/export`, datum: 1623 };
