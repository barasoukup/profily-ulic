// France (Bára 22. 11. 2026): IGN's orthophoto (Géoplateforme WMS-Raster, HR.ORTHOIMAGERY.ORTHOPHOTOS, 20 cm, in places 5–15 cm; CORS *,
// Licence Ouverte 2.0). Beyond France the service answers an opaque white image: the map's layer is kept inside France.
// Monaco is covered by the same service (ortho/sources/mc.js).
export const FR_SERVICE = { type: "wms", keys: "upper", base: "https://data.geopf.fr/wms-r", layers: "HR.ORTHOIMAGERY.ORTHOPHOTOS" };
export const sources = [
  { id: "fr", res: 0.2, credit: "common.orthophotoIgnGeoplateforme", service: FR_SERVICE,
    map: { kind: "bbox", state: "france", limit: "inside", suffix: "&TRANSPARENT=TRUE" } },
];
