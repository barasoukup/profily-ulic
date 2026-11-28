// Spain (Bára 23. 11. 2026): IGN's PNOA máxima actualidad (WMS, 25 cm, the latest flight; CORS *, CC BY 4.0 scne.es). Beyond Spain
// the service draws MODIS and Sentinel-2 (the map's layer is kept inside Spain). `area.except`: Melilla's box (states.json "spain"):
// PNOA has a Pléiades Neo image © Airbus DS there under a licence not yet cleared (evaluation/spain/SOURCES.md 1): not read there,
// and its ring left out of the area the map's layer is drawn over.
export const sources = [
  { id: "es", res: 0.25, credit: "common.pnoaOrthophotoIgnCc", area: { except: [[-2.98, 35.26, -2.92, 35.33]] },
    service: { type: "wms", keys: "upper", base: "https://www.ign.es/wms-inspire/pnoa-ma", layers: "OI.OrthoimageCoverage" },
    map: { kind: "bbox", state: "spain", limit: "inside", suffix: "&TRANSPARENT=TRUE" } },
];
