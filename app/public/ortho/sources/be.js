// Belgium (Bára 20. 11. 2026): the orthophoto of each region, tried in turn (the first with a photo wins, as near a German Land's
// border): the region of the cut's centre first (the hostile review: a Flemish image half white at the language border), then
// Flanders', then Wallonia's. Flanders' middle-scale orthophoto (Digitaal Vlaanderen, WMS in Web Mercator, CORS *; it also covers
// Brussels) and Wallonia's latest one (SPW, ArcGIS export, CORS for the origin asking). The map's layers each ask only for tiles
// over their regions (regions-be.json), Wallonia's first.
export const chain = { id: "be", pick: "regions", share: true, fallback: ["be-vl", "be-wal"] };
export const sources = [
  { id: "be-wal", chain: "be", regions: ["wal"], res: 0.1, blank: true, credit: "credits.orthophotoSpwServicePublic",
    service: { type: "ags", base: "https://geoservices.wallonie.be/arcgis/rest/services/IMAGERIE/ORTHO_LAST/MapServer" },
    map: { kind: "bbox", state: "belgium", regions: ["wal"], limit: "inside" } },
  { id: "be-vl", chain: "be", regions: ["vl", "bru"], res: 0.1, blank: true, credit: "credits.orthophotoBronLuchtopnamenDigitaal",
    service: { type: "wms", base: "https://geo.api.vlaanderen.be/OMWRGBMRVL/wms", layers: "Ortho", transparent: true },
    map: { kind: "bbox", state: "belgium", regions: ["vl", "bru"], limit: "inside" } },
];
