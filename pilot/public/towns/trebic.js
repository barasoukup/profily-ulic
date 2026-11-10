// Třebíč: the town's road passport (PaKom 2020 on gis.trebic.cz, ArcGIS, CORS): surfaces of the roads the town
// keeps (roadway, car parks, sidewalks, stairs, cycle paths, other paved areas; also the state and regional roads
// through the town), laid over the national DTM of ČÚZK (towns/overlay.js), which in Vysočina holds mostly the
// main roads, with RÚIAN's buildings and parcels where it has nothing. Street lamps and benches of the town's
// passports where OSM has none; floors of the buildings from RÚIAN of ČÚZK.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; see towns/jihlava.js) and app.js its base maps.
import { query, envelope, osmTiles, boxAround, asMtvu, addPoints, ruianBuilding } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { overDmvs } from "./overlay.js";

const TR = "https://gis.trebic.cz/arcgis/rest/services/public";
const TR_SURFACES = `${TR}/PaKom2020/MapServer/6/query`;
// The town's services turn S-JTSK into WGS 84 by 15965 by default, 4 m off OSM and RÚIAN: answers come with
// S_JTSK_To_WGS_1984_1 (1623), within 0.5 m of OSM's buildings.
const trQuery = (url, params) => query(url, { ...params, datumTransformation: 1623 });
const none = () => ({ features: [] });

// typ_pov_05: 1 komunikace (a car park when the note says so), 2 chodník, 3 schodiště, 4 ostatní (paved areas,
// driveways), 5 cyklostezka.
const code = (a) => {
  switch (a.typ_pov_05) {
    case 1: return /parkovišt/i.test(a.poznamk_13 || "") ? 704 : 701;
    case 2: case 3: return 702;
    case 4: return 1003;
    case 5: return 703;
    default: return null;
  }
};
// The passport's surfaces alone (MTVU features), and over the national DTM.
export async function own(bbox) {
  return asMtvu([[await trQuery(TR_SURFACES, { ...envelope(bbox), outFields: "typ_pov_05,poznamk_13" }), code]], MTVU_LABELS);
}
const surfaces = async (bbox) => overDmvs(await own(bbox), bbox);

// No lines the browser could read (the town's technical map is not public): fences and walls from OSM.
const lines = async () => none();
// The town's paid parking areas (cortec_parkovani) are whole zones, not stalls: OSM's tags give the parking.
const parking = async () => none();

// OSM around a point plus the town's street lamps and benches where OSM has none nearby.
const TR_POINTS = [
  [`${TR}/VO/MapServer/0/query`, "OBJECTID", () => ({ highway: "street_lamp" })],
  [`${TR}/komunal_lavicky/FeatureServer/0/query`, "OBJECTID", () => ({ amenity: "bench" })],
];
async function osm(lat, lon, radius) {
  const box = boxAround(lat, lon, Math.min(radius, 50));
  const [o, ...pts] = await Promise.all([
    osmTiles(lat, lon, radius),
    ...TR_POINTS.map(([url, outFields]) => trQuery(url, { ...envelope(box), outFields }).catch(none)),
  ]);
  return addPoints(o, pts, TR_POINTS.map(([, , tagsOf]) => tagsOf), "Třebíč", lat);
}

export const sources = { osm, surfaces, lines, parking, podlaznost: ruianBuilding };
export { RUIAN_HALL, RUIAN_LOW } from "../gis.js";
// No base maps of its own (the national ones show the town); the orthophoto of the evaluation is ČÚZK's.
export const ortho = null;
// The surfaces already include the national DTM (towns/overlay.js): sources.js must not ask it again.
export const national = true;
