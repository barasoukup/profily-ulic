// Finland (Bára 23. 11. 2026): no national orthophoto without a key (the MML's needs a personal one, which would show in the browser;
// evaluation/finland/SOURCES.md 1), so only the towns' own WMS in Web Mercator with CORS *, each CC BY 4.0 on HRI / avoindata.fi
// (checked 23. 11. 2026): Helsinki's of 2026 (5 cm, a true orthophoto), Espoo's latest "Ortokartta" (about 30 cm) and Turku's true
// orthophoto of 2022 (5 cm; its layer of 2025 has no licence of its own published). Each only over its town's box (Helsinki first where
// the boxes overlap: `rank`); elsewhere in Finland no orthophoto (laneImage null: the estimate from OSM). The map has them in the
// other order (Helsinki's layer on top).
const wms = (base, layers) => ({ type: "wms", keys: "upper", base, layers, transparent: true });
const town = (id, rank, res, box, service, credit) => ({ id, chain: "fi", rank, res, blank: true, credit, area: { box }, service,
  map: { kind: "bbox", state: "finland", limit: "inside", bounds: "box" } });
export const chain = { id: "fi", pick: "area" };
export const sources = [
  town("fi-tku", 2, 0.1, [22.05, 60.33, 22.55, 60.62], wms("https://turku.asiointi.fi/TeklaOGCWeb/WMS.ashx", "Ilmakuva 2022 True ortho"), "credits.orthophotoTurunKaupunki2022"),
  town("fi-esp", 1, 0.3, [24.5, 60.08, 24.85, 60.36], wms("https://kartat.espoo.fi/teklaogcweb/wms.ashx", "Ortokartta"), "credits.orthophotoEspoonKaupunkiCc"),
  town("fi-hki", 0, 0.1, [24.82, 60.125, 25.27, 60.305], wms("https://kartta.hel.fi/ws/geoserver/avoindata/wms", "avoindata:Ortoilmakuva_2026_5cm"), "credits.orthophotoHelsinginKaupunkiKaupunkimittauspalvel"),
];
