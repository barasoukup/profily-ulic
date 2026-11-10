// Hradec Králové: the town's road passport (pasport komunikací, T-MAPY MapServer WFS on geoportal.mmhk.cz,
// layer pk-pov-typ: surfaces of the roads the town and the region keep, typed roadway / sidewalk / cycle path,
// with the class of the road and its parking areas and bus bays) laid over the national DTM of ČÚZK (dmvs.js),
// which gives everything else (buildings, green, gardens, roads outside the passport). Floors of the buildings
// from RÚIAN of ČÚZK.
//
// An A/B variant (evaluation/ab.mjs), NOT CONNECTED: the WFS sends no Access-Control-Allow-Origin, so a browser on another origin cannot read it
// (the town's ArcGIS on the same host, with CORS, has the technical map only as CAD lines). The module serves
// the evaluation (CITY=hradec VARIANTS=city,hradec-pasport CACHE=disk node evaluation/ab.mjs), which runs in Node. Once the
// town's server allows other origins (as T-MAPY's servers of Jablonec, Děčín and Tábor do), the module can
// become pilot/public/towns/hradec.js (sources: osm tiles, these surfaces, RÚIAN floors) and be registered.
import { getJSON, asMtvu } from "../../pilot/public/gis.js";
import { MTVU_LABELS } from "../../pilot/public/city.js";
import { surfaces as dmvsSurfaces } from "../../pilot/public/dmvs.js";

const HK_PAKOM = "https://geoportal.mmhk.cz/services/mapserver/common/pakom/gservice";

// GeoJSON polygons → ArcGIS rings.
const rings = (g) => (g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null);

// The passport's surfaces in an envelope "x0,y0,x1,y1" (WFS 2.0 in EPSG:4326 takes latitude first).
async function passport(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",");
  const json = await getJSON(`${HK_PAKOM}?${new URLSearchParams({
    service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "ms:pk-pov-typ", srsName: "EPSG:4326",
    bbox: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326`, propertyName: "typ,komunikace_trida",
    outputFormat: "application/json; charset=utf-8",
  })}`);
  return { features: (json.features || []).map((f) => ({ attributes: f.properties || {}, geometry: { rings: rings(f.geometry) } })).filter((f) => f.geometry.rings) };
}

// typ → MTVU: roadway (a parking area of the road: 704), sidewalk, cycle path.
const code = (a) => {
  if (a.typ === "chodník") return 702;
  if (a.typ === "cyklostezka") return 703;
  if (a.typ === "komunikace") return /parkoviště/.test(a.komunikace_trida || "") ? 704 : 701;
  return null;
};

// The passport first (derive.js takes the first surface a point lies in), then the national DTM.
async function surfaces(bbox) {
  const [p, d] = await Promise.all([passport(bbox), dmvsSurfaces(bbox, MTVU_LABELS).catch(() => ({ features: [] }))]);
  const own = asMtvu([[p, code]], MTVU_LABELS);
  return { ...d, features: [...own.features, ...(d.features || [])] };
}

export const about = "pasport komunikací HK (WFS) nad DTM ČÚZK";
export { surfaces };
