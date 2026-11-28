// Poland (Bára 21. 11. 2026): GUGiK's orthophoto map (Geoportal, PZGIK ORTO HighResolution WMS in Web Mercator, CORS for the origin
// asking; the national orthophoto, open data). On the map only for tiles over Poland, transparent where it has no photo (it has some
// up to about 1 km beyond the border, so at the border its tiles cover the Czech ones there: the hostile review).
export const sources = [
  { id: "pl", res: 0.1, credit: "common.orthophotoGugikGeoportalGov",
    service: { type: "wms", keys: "upper", base: "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/HighResolution", layers: "Raster" },
    map: { kind: "bbox", state: "poland", limit: "inside", suffix: "&TRANSPARENT=TRUE" } },
];
