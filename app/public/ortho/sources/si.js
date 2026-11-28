// Slovenia (Bára 23. 11. 2026): GURS's colour orthophoto DOF025 (25 cm) in its own Web Mercator pyramid (WMS of the Geodetska uprava
// RS, CORS *, CC BY 4.0; evaluation/slovenia/SOURCES.md). The server answers within a second or hangs for 30 s and gives 504 (also
// inside Slovenia, at random; always beyond it, so the map's layer is kept inside). `hangs`: ortho/si-retry.js asks again. The map's
// layer (the review of 24. 11. 2026, RECENZE-SI 3): a tile of z9 over the whole state and some of z18 were 504 after 30 s, so it starts
// at z14 (below it the other basemaps), a tile wholly inside Slovenia is a JPEG (PNG takes GURS twice as long; transparent only at the
// border) and a failed tile is asked once more.
export const sources = [
  { id: "si", res: 0.25, hangs: true, credit: "credits.orthophotoDof025GeodetskaUprava", mapCredit: "app.orthophotoDof025GeodetskaUprava",
    service: { type: "wms", keys: "upper", base: "https://ipi.eprostor.gov.si/wms-si-gurs-dts/wms", layers: "SI.GURS.ZPDZ:DOF025_3857" },
    map: { kind: "bbox", state: "slovenia", limit: "inside", suffix: "&TRANSPARENT=TRUE", jpegInside: true, minZoom: 14, retry: true } },
];
