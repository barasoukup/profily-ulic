// Malta (Bára 23. 11. 2026): the Planning Authority's orthophoto of 2018 (15 cm, WMS of wetransform, CORS *, CC BY 4.0), Malta, Gozo and
// Comino. The service has no Web Mercator: the box is asked in degrees (CRS:84, lon lat); over a cut's hundred metres a degree's image
// and a Mercator one differ by under a centimetre. Black beyond the islands. On the map a JPEG inside the islands, a transparent PNG
// only on a tile across the coast (as Slovenia; the review of Malta).
export const sources = [
  { id: "mt", res: 0.15, blank: true, credit: "credits.orthophotoPlanningAuthorityMalta", mapCredit: "app.orthophotoPlanningAuthorityMalta",
    service: { type: "wms", keys: "upper", base: "https://malta.coverage.wetransform.eu/wms/ortho_2018/ows", layers: "OI.OrthoimageCoverage", crs: "CRS:84", degrees: true },
    map: { kind: "bbox", state: "malta", limit: "inside", suffix: "&TRANSPARENT=TRUE", jpegInside: true } },
];
