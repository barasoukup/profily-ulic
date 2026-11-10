// Frýdek-Místek: the town's road passport (pasport komunikací) and passport of green (pasport zeleně) on its
// T-MAPY server (gis.frydekmistek.cz, MapServer WFS 2.0, GeoJSON, CORS): surfaces of the roads the town keeps
// (local roads, state and regional roads through the town, sidewalks, cycle paths, bus bays, driveways,
// stairs) and its lawns, shrubs and flower beds, laid over the national DTM of ČÚZK (towns/overlay.js), which
// in Moravskoslezský kraj holds mostly the main roads, with RÚIAN's buildings and parcels where it has
// nothing. Trees, benches, bike stands and lamps from the town's passports where OSM has none; floors of the
// buildings from RÚIAN of ČÚZK.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; see towns/jihlava.js) and app.js its base maps.
import { osmTiles, boxAround, asMtvu, addPoints, ruianBuilding } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { overDmvs, tmapyWfs } from "./overlay.js";

const FM = "https://gis.frydekmistek.cz/services/mapserver/common";
const none = () => ({ features: [] });

// The server answers a box in WGS 84 but turns its own coordinates into WGS 84 wrongly (overlay.js wfs):
// asked for Web Mercator, which comes out by another transformation than RÚIAN's and the orthophoto's
// (S-JTSK → WGS 84 by EPSG 1623), 0.5 m west and 0.4 m south of them across the town: shifted back.
const SHIFT = [0.0000068, 0.0000035];
const wfs = (base, type, bbox, props) => tmapyWfs(base, type, bbox, props, SHIFT);

// Kinds of the passport's surfaces (typ) → MTVU codes. A driveway across a sidewalk is sidewalk; the paved
// area of a driveway off the roadway ("příjezd z vozovky") lies at the roadway's level and often in it (a strip
// of the roadway as a paved area became a median, č. 51, 55): roadway. A yard for bins, a service area and a
// paved area in an estate are paved areas.
export const PAKOM_CODES = [
  [/příjezd přes chodník/, 702], [/komunikace|silnice|záliv|příjezd z vozovky/, 701],
  [/chodník|čekárna|schody|^cesta/, 702], [/cyklostezka/, 703], [/manipulační|kontejner|zp\. plocha/, 1003],
];
export const pakomCode = (a) => PAKOM_CODES.find(([re]) => re.test(a.typ || ""))?.[1] ?? null;
// Kinds of the passport of green (druh_nazev) → MTVU: lawns, shrubs, beds, hedges as green; paths, stairs,
// playgrounds and "technical" areas are the road passport's or left out.
export const greenCode = (a) => {
  const t = a.druh_nazev || "";
  if (/^Cesty|Schodiště|Hřiště|Pískoviště|technické|bez vegetačního/.test(t)) return null;
  if (/Vodote|Vodní/.test(t)) return 501;
  return 401;
};

// The passports' surfaces alone (MTVU features: the roads, and the green under the DTM), and over the national DTM.
export async function own(bbox) {
  const [pakom, green] = await Promise.all([
    wfs(`${FM}/pakom`, "ms:pk-pov", bbox, "typ,msGeometry"),
    wfs(`${FM}/pazel`, "ms:pz-p-ver", bbox, "druh_nazev,msGeometry").catch(none),
  ]);
  return { passport: asMtvu([[pakom, pakomCode]], MTVU_LABELS), green: asMtvu([[green, greenCode]], MTVU_LABELS) };
}
const surfaces = async (bbox) => { const o = await own(bbox); return overDmvs(o.passport, bbox, o.green); };

// No lines the browser could read (the town's technical map is not public): fences and walls from OSM.
const lines = async () => none();
// The passport's parking areas carry no orientation: the DTM's car parks and OSM's tags give the parking.
const parking = async () => none();

// OSM around a point plus the town's trees, benches, bike stands and lamp posts where OSM has none nearby.
const FM_POINTS = [
  [`${FM}/pazel`, "ms:pz-biob-ver", "druh_nazev", (a) => (/strom/i.test(a.druh_nazev || "") ? { natural: "tree" } : null)],
  [`${FM}/pamob`, "ms:mob-nab", "typ", () => ({ amenity: "bench" })],
  [`${FM}/pamob`, "ms:mob-dop", "typ", (a) => (/kol/i.test(a.typ || "") ? { amenity: "bicycle_parking" } : null)],
  [`${FM}/paosv`, "ms:osv-sto-s", "pocet_lamp", () => ({ highway: "street_lamp" })],
];
async function osm(lat, lon, radius) {
  const box = boxAround(lat, lon, Math.min(radius, 50));
  const [o, ...pts] = await Promise.all([
    osmTiles(lat, lon, radius),
    ...FM_POINTS.map(([base, type, props]) => wfs(base, type, box, `${props},msGeometry`).catch(none)),
  ]);
  return addPoints(o, pts, FM_POINTS.map(([, , , tagsOf]) => tagsOf), "Frýdek-Místek", lat);
}

export const sources = { osm, surfaces, lines, parking, podlaznost: ruianBuilding };
export { RUIAN_HALL, RUIAN_LOW } from "../gis.js";

// No base maps of its own (the national ones show the town); the orthophoto of the evaluation is ČÚZK's.
export const ortho = null;
// The surfaces already include the national DTM (towns/overlay.js): sources.js must not ask it again.
export const national = true;
