// Italy (Bára 23. 11. 2026): only orthophotos with an open licence (CC BY 4.0, evaluation/italy/SOURCES.md), each with its box: Bologna
// 2023 and Modena 2024 (Emilia-Romagna's services), Turin 2023 (the Comune's), the province of Bolzano 2023 (flown in collaboration with
// AGEA under the monitoring plan; the province's metadata license it CC BY 4.0, Bára 23. 11. 2026: use it). AGEA's own layers (the
// rest of Italy) are for institutional use only. All WMS in EPSG:3857 with CORS. Modena's box reaches 44.75 for the town's two northern
// exclaves (the review of 23. 11. 2026) and 10.77 for its western edge by ISTAT's border (tools/build_boundaries.mjs states). A box's `outside` is
// the territory it overlaps and does not cover (Bolzano's box reaches into Lombardy: Ponte di Legno, Valfurva; the review of 24. 11. 2026).
// Turin's credit in the wording the Geoportale del Comune di Torino requires (its "Licenze d'uso", Bára 23. 11. 2026): "Base cartografica
// realizzata da [Licenziatario], integrata con [Livelli informativi o Servizi][data] della Città di Torino reperiti sul Geoportale del
// Comune di Torino", in Italian in every language, after "ortofoto {who}".
import { inLombardy } from "../../towns/lombardy-area.js";

const wms = (base, layers) => ({ type: "wms", keys: "upper", base, layers });
const open = (id, res, box, service, rest) => ({ id, chain: "it", res, blank: true, area: { box }, service,
  map: { kind: "bbox", state: "italy", limit: "inside", bounds: "box", suffix: "&TRANSPARENT=TRUE" }, ...rest });
export const chain = { id: "it", pick: "area" };
export const sources = [
  open("it-bo", 0.15, [11.22, 44.42, 11.44, 44.56], wms("https://servizigis.regione.emilia-romagna.it/wms/comune_bo_2023_rgb", "Comune_BO_2023_RGB"), { credit: "credits.orthophotoComuneDiBologna" }),
  open("it-mo", 0.15, [10.77, 44.52, 11.03, 44.75], wms("https://servizigis.regione.emilia-romagna.it/wms/comune_mo_2024_rgb", "Comune_MO_2024_RGB"), { credit: "credits.orthophotoComuneDiModena" }),
  open("it-to", 0.1, [7.57, 44.99, 7.78, 45.15], wms("https://geomap.reteunitaria.piemonte.it/mapproxy/service", "coto_ortofoto_2023"),
    { creditWho: "© Città di Torino (CC BY 4.0): Base cartografica realizzata da Bara Soukup, integrata con Ortofoto digitale colore 2023 della Città di Torino reperiti sul Geoportale del Comune di Torino" }),
  { ...open("it-bz", 0.2, [10.38, 46.21, 12.48, 47.1], wms("https://geoservices.buergernetz.bz.it/mapproxy/wms", "p_bz-Orthoimagery:Aerial-2023-RGB"), { credit: "credits.orthophotoProvinciaAutonomaDi" }),
    area: { box: [10.38, 46.21, 12.48, 47.1], outside: inLombardy } },
];
