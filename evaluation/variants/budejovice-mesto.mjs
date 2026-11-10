// České Budějovice, tried 10. 11. 2026: the town publishes no surfaces of its streets (no roadway or sidewalk
// polygons; its road passport GL_MISTKOM and the sidewalks GL_CHODNIKY are centre lines without widths), only
// on ArcGIS Online (services9.arcgis.com/8svDug0pVvBQzXWS, CORS *): the lawns of its green passport
// (GP_TRAVNIK, Melies 2008–2018, 8 925 polygons), its benches (GB_PASPORT_LAVICKY, 2 962 points, kept current)
// and its paid parking sections (GL_PARKUSEKY, lines; variant budejovice-stani). This variant: the national DTM
// as now (towns/cesko.js), the town's lawns only where the DTM leaves a blank inside the area it has drawn
// (towns/overlay.js "under"; in the DTM's blank quarters the profile stays the OSM estimate: lawns alone are
// no profile), and the benches where OSM has none within 3 m.
//   CITY=budejovice VARIANTS=city,budejovice-mesto,budejovice-stani CACHE=disk ONLY=… node evaluation/ab.mjs
import { query, envelope, osmTiles, boxAround, asMtvu, addPoints } from "../../pilot/public/gis.js";
import { MTVU_LABELS } from "../../pilot/public/city.js";
import { surfaces as dmvsSurfaces } from "../../pilot/public/dmvs.js";

export const CB = "https://services9.arcgis.com/8svDug0pVvBQzXWS/arcgis/rest/services";
const none = () => ({ features: [] });

export const about = "DTM ČÚZK + trávníky a lavičky města";
export async function surfaces(bbox) {
  const [d, lawns] = await Promise.all([
    dmvsSurfaces(bbox, MTVU_LABELS),
    query(`${CB}/GP_TRAVNIK/FeatureServer/0/query`, { ...envelope(bbox), outFields: "ObjectId" }).catch(none),
  ]);
  if (!d.features?.length) return d;
  return { ...d, features: [...d.features, ...asMtvu([[lawns, 401]], MTVU_LABELS).features] };
}

const BENCHES = `${CB}/GB_PASPORT_LAVICKY/FeatureServer/0/query`;
export async function osm(lat, lon, radius) {
  const box = boxAround(lat, lon, Math.min(radius, 50));
  const [o, b] = await Promise.all([
    osmTiles(lat, lon, radius),
    query(BENCHES, { ...envelope(box), outFields: "OBJECTID" }).catch(none),
  ]);
  return addPoints(o, [b], [() => ({ amenity: "bench" })], "České Budějovice", lat);
}
