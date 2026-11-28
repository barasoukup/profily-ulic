// Cyprus (Bára 23. 11. 2026: "Orto vezměme to novější"): the DLS orthophoto of 2019 (a tile cache in Web Mercator to level 21, CORS
// echo; no licence stated, unlike the 2014 one, CC BY 4.0), only the south and the British bases (a missing tile is a 404 there; left
// transparent on the canvas). Level 20 (about 12 cm at 35° N).
export const sources = [
  { id: "cy", res: 0.12, blank: true, credit: "common.orthophotoDlsCyprus",
    service: { type: "xyz", base: "https://eservices.dls.moi.gov.cy/arcgis/rest/services/BASEMAPS/Orthoimagery_2019_WebMercator/MapServer/tile", z: 20, px: 256 },
    map: { kind: "tiles", state: "cyprus", limit: "inside", maxNativeZoom: 21 } },
];
