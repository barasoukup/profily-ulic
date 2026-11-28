// Portugal (Bára 23. 11. 2026): DGT's orthophotos (WMS, EPSG:3857, CORS *, CC BY; evaluation/portugal/SOURCES.md): the aerial of
// 2025 (25 cm, the whole mainland), else 2021 (30 cm, the north only), else 2018 (25 cm), else the satellite mosaic of 2023 (30 cm,
// softer). An image white where a flight has no photo (laneImage tries the next one); Madeira and the Azores have none of them (their
// own services: unclear licence, no CORS), so the mainland's box (states.json "portugal": the mainland ring and the Berlengas) is
// their `area` (the review of 23. 11. 2026). The map has only the flight of 2025 (the review: three stacked layers tripled the requests).
const MAINLAND = [-9.6, 36.9, -6.1, 42.2];
const dgt = (id, res, base, layers, extra = {}) => ({ id, chain: "pt", res, blank: true, credit: "common.orthophotoDgt", area: { box: MAINLAND },
  service: { type: "wms", keys: "upper", base, layers }, map: null, ...extra });
export const chain = { id: "pt", pick: "area", share: true };
export const sources = [
  dgt("pt-25", 0.25, "https://cartografia.dgterritorio.gov.pt/wms/ortos2025", "Ortos2025-RGB", { map: { kind: "bbox", state: "portugal", limit: "inside", bounds: "box", suffix: "&TRANSPARENT=TRUE" } }),
  dgt("pt-21", 0.3, "https://cartografia.dgterritorio.gov.pt/wms/ortos2021", "Ortos2021-RGB"),
  dgt("pt-18", 0.25, "https://cartografia.dgterritorio.gov.pt/wms/ortos2018", "Ortos2018-RGB"),
  dgt("pt-sat", 0.3, "https://ortos.dgterritorio.gov.pt/wms/ortosat2023", "ortoSat2023-CorVerdadeira"),
];
