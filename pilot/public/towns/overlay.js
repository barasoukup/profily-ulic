// A town's own surfaces that cover only the roads (a road passport: roadway, sidewalk, cycle path) laid over
// the national DTM of ČÚZK (dmvs.js), which gives the rest (buildings, green, gardens, roads the passport
// does not keep). Where the DTM has nothing around the cut (local streets of the regions that map only the
// main roads, dmvs.js then answers no features), RÚIAN's buildings and parcels fill in around the passport,
// as dmvs.js does it inside a street the DTM has drawn: the profile ends at the houses and front gardens.
// The RÚIAN requests are the ones dmvs.js has just made (the browser and the evaluation reuse them).
// Used by towns/frydek-mistek.js, karvina.js, trebic.js.
import { asMtvu, getJSON } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { surfaces as dmvsSurfaces, ruianAreas } from "../dmvs.js";

// Kinds of land (druh pozemku) and uses (způsob využití) of a parcel → MTVU codes, as dmvs.js; a road's
// parcel beyond the passport's surfaces is mostly a grass verge (an estimate), as in Jihlava.
const LAND_KIND = { 2: 100, 3: 100, 4: 100, 5: 300, 6: 100, 7: 401, 10: 200, 11: 501, 13: 603 };
const LAND_USE = {
  12: 603, 14: 1100, 15: [401, true], 16: [401, true], 17: [401, true], 18: [1003, true], 19: 401, 20: 901,
  21: 402, 22: 1003, 23: 1003, 27: 402, 30: 402, 6: 502, 7: 501, 8: 501, 9: 502, 10: 502, 11: 402,
};
const parcelCode = (a) => LAND_USE[a.zpusobyvyuzitipozemku] ?? LAND_KIND[a.druhpozemkukod] ?? null;

// own: MTVU features (asMtvu) of the town's passport. They come first: derive.js takes the first surface
// a point lies in, so the passport wins over the DTM's drawing of the same road. under: the town's surfaces
// that only fill what the DTM leaves open (a passport of green: its lawns may still lie over a road rebuilt
// since, Karviná č. 56).
export async function overDmvs(own, bbox, under = { features: [] }) {
  const d = await dmvsSurfaces(bbox, MTVU_LABELS).catch(() => ({ features: [] }));
  if (!own.features.length) return d;
  if (d.features?.length) return { ...d, features: [...own.features, ...d.features, ...under.features] };
  return withRuian({ features: [...own.features, ...under.features] }, bbox);
}

// The passport with RÚIAN's buildings and parcels around it: buildings first (a passport's sidewalk may run
// under an arcade), then the passport, then the parcels.
export async function withRuian(own, bbox) {
  if (!own.features.length) return own;
  const r = await ruianAreas(bbox);
  const fill = asMtvu([[r.buildings, 601], [r.parcels, parcelCode]], MTVU_LABELS);
  const buildings = fill.features.filter((f) => f.attributes.CTVUK_KOD === 601);
  const parcels = fill.features.filter((f) => f.attributes.CTVUK_KOD !== 601);
  return { features: [...buildings, ...own.features, ...parcels] };
}

// Features of a WFS type of a T-MAPY MapServer (pasport komunikací, zeleně, mobiliáře, osvětlení: Frýdek-Místek,
// Karviná) in an envelope "x0,y0,x1,y1", as ArcGIS features ({ attributes, geometry } in WGS 84). The box goes in
// WGS 84 (latitude first); the answer is asked in Web Mercator: with srsName EPSG:4326 these servers return
// nothing for a box, and in their own S-JTSK the browser would have to convert. shift: [lon, lat] added to the
// answer where the server's S-JTSK → WGS 84 differs from EPSG 1623 (RÚIAN, the orthophoto). props: the
// fields, with the geometry "msGeometry".
const R = 6378137;
const ringsOf = (g) => (g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null);
export async function tmapyWfs(base, type, bbox, props, shift = [0, 0]) {
  const lonLat = ([x, y]) => [(x / R) * (180 / Math.PI) + shift[0], (360 / Math.PI) * Math.atan(Math.exp(y / R)) - 90 + shift[1]];
  const point = (c) => { const [x, y] = lonLat(c); return { x, y }; };
  const [x0, y0, x1, y1] = bbox.split(",");
  const json = await getJSON(`${base}/gservice?${new URLSearchParams({
    SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: type, SRSNAME: "EPSG:3857", COUNT: 2000,
    BBOX: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326`, OUTPUTFORMAT: "application/json; charset=utf-8",
    ...(props ? { PROPERTYNAME: props } : {}),
  })}`);
  return {
    features: (json.features || []).map((f) => {
      const g = f.geometry;
      const geometry = g?.type === "Point" ? point(g.coordinates) : g?.type === "MultiPoint" ? point(g.coordinates[0])
        : ringsOf(g) ? { rings: ringsOf(g).map((r) => r.map(lonLat)) }
        : g?.type === "LineString" ? { paths: [g.coordinates.map(lonLat)] }
        : g?.type === "MultiLineString" ? { paths: g.coordinates.map((l) => l.map(lonLat)) } : null;
      return { attributes: f.properties || {}, geometry };
    }).filter((f) => f.geometry),
  };
}
