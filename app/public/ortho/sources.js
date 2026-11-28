import { dkToken } from "../keys.js";
import { inArea } from "../places.js";
import { inLombardy } from "../towns/lombardy-area.js";

export const R = 6378137;
export const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
// Each city's best orthophoto (evaluation/orthophoto/REPORT.md; the key: city.js laneOrtho of the city, else the state's,
// countries/<ISO>.js): Prague IPR 10 cm (summer 2024), Brno's 2025 (tiles of
// about 10 cm, shifted against ČÚZK by 1.06 m east and 3.09 m north: evaluation/orthophoto/shift.mjs), Plzeň's 2024
// (5 cm, asked at 10 cm, no shift), elsewhere ČÚZK 12.5 cm. shift: where the image shows a point, east and north (m).
// Slovakia (Bára 15. 11. 2026): the ZBGIS orthophoto mosaic of ÚGKK SR (GKÚ, NLC), its cache in Web Mercator to level 19
// (about 10 cm on the ground; Bratislava 2023, Košice 2025), CORS for any origin, tiles cached a day.
// Austria (Bára 16. 11. 2026): basemap.at's orthophoto (Verwaltungsgrundkarte, CC BY 4.0), Web Mercator tiles to level 20
// (about 10 cm a pixel, the photo 15–30 cm), CORS for any origin.
export const AT_ORTHO = "https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857";
// Switzerland and Liechtenstein (Bára 17. 11. 2026): swisstopo's SWISSIMAGE 10 cm (open data of the Confederation,
// "© swisstopo"), WMTS tiles in Web Mercator to level 20 (21 refused), CORS for any origin; it covers Liechtenstein and
// a strip beyond the border. Its tiles are {z}/{x}/{y} (xy below), not ArcGIS's {z}/{y}/{x}.
export const CH_ORTHO = "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857";
// The Netherlands (Bára 20. 11. 2026): PDOK's Luchtfoto, the yearly national orthophoto of Beeldmateriaal Nederland
// (Actueel_orthoHR, 8 cm, open data), WMTS tiles in Web Mercator to level 21, {z}/{x}/{y}, CORS for any origin.
export const NL_ORTHO = "https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857";
// Belgium (Bára 20. 11. 2026): the orthophoto of each region, tried in turn (the first with a photo wins, as near a
// German Land's border): Flanders' middle-scale orthophoto (Digitaal Vlaanderen, WMS in Web Mercator, CORS *; it also
// covers Brussels) and Wallonia's latest one (SPW, ArcGIS export, CORS for the origin asking).
export const BE_ORTHO = {
  vl: { url: (b, w, h, format = "image/jpeg") => `https://geo.api.vlaanderen.be/OMWRGBMRVL/wms?${new URLSearchParams({ service: "WMS", request: "GetMap", version: "1.3.0", layers: "Ortho", styles: "", crs: "EPSG:3857", bbox: b.join(","), width: w, height: h, format, ...(format === "image/png" && { transparent: "TRUE" }) })}`, credit: "© Digitaal Vlaanderen" },
  wal: { url: (b, w, h, format) => `https://geoservices.wallonie.be/arcgis/rest/services/IMAGERIE/ORTHO_LAST/MapServer/export?${new URLSearchParams({ bbox: b.join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: format === "image/png" ? "png32" : "jpg", ...(format === "image/png" && { transparent: "true" }), f: "image" })}`, credit: "© SPW" },
};
// Luxembourg (Bára 20. 11. 2026): the latest orthophoto of the ACT (geoportail.lu, WMTS {z}/{x}/{y} in Web Mercator to
// level 21, CORS *).
export const LU_ORTHO = "https://wmts1.geoportail.lu/opendata/wmts/ortho_latest/GLOBAL_WEBMERCATOR_4_V3";
// Poland (Bára 21. 11. 2026): GUGiK's orthophoto map (Geoportal, PZGIK ORTO HighResolution WMS in Web Mercator, CORS
// for the origin asking; the national orthophoto, open data).
export const PL_ORTHO = (b, w, h, format = "image/jpeg") => `https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/HighResolution?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: "Raster", STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: format })}`;
// France (Bára 22. 11. 2026): IGN's orthophoto (Géoplateforme WMS-Raster, HR.ORTHOIMAGERY.ORTHOPHOTOS, 20 cm, in places
// 5–15 cm; CORS *, Licence Ouverte 2.0). Beyond France the service answers an opaque white image (the map's layer is
// kept inside France, app.js insideOnly).
export const FR_ORTHO = (b, w, h, format = "image/jpeg") => `https://data.geopf.fr/wms-r?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: "HR.ORTHOIMAGERY.ORTHOPHOTOS", STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: format })}`;
// Spain (Bára 23. 11. 2026): IGN's PNOA máxima actualidad (WMS, 25 cm, the latest flight; CORS *, CC BY 4.0 scne.es).
// Beyond Spain the service draws MODIS and Sentinel-2 (the map's layer is kept inside Spain, app.js insideOnly).
export const ES_ORTHO = (b, w, h, format = "image/jpeg") => `https://www.ign.es/wms-inspire/pnoa-ma?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: "OI.OrthoimageCoverage", STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: format })}`;
// Portugal (Bára 23. 11. 2026): DGT's orthophotos (WMS, EPSG:3857, CORS *, CC BY; evaluation/portugal/SOURCES.md): the
// aerial of 2025 (25 cm, the whole mainland), else 2021 (30 cm, the north only), else 2018 (25 cm), else the satellite
// mosaic of 2023 (30 cm, softer). An image white where a flight has no photo (laneImage tries the next one); Madeira and
// the Azores have none of them (their own services: unclear licence, no CORS).
const ptWms = (base, layer) => (b, w, h, format = "image/jpeg") => `${base}?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: layer, STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: format })}`;
export const PT_ORTHO = {
  "pt-25": ptWms("https://cartografia.dgterritorio.gov.pt/wms/ortos2025", "Ortos2025-RGB"),
  "pt-21": ptWms("https://cartografia.dgterritorio.gov.pt/wms/ortos2021", "Ortos2021-RGB"),
  "pt-18": ptWms("https://cartografia.dgterritorio.gov.pt/wms/ortos2018", "Ortos2018-RGB"),
  "pt-sat": ptWms("https://ortos.dgterritorio.gov.pt/wms/ortosat2023", "ortoSat2023-CorVerdadeira"),
};
// The mainland's box (states.json "portugal": the mainland ring and the Berlengas): DGT has no photo on Madeira and the
// Azores, so they are not asked there (the review of 23. 11. 2026). Melilla's box (states.json "spain"): PNOA has a
// Pléiades Neo image © Airbus DS there under a licence not yet cleared (evaluation/spain/SOURCES.md 1): not read there.
export const PT_MAINLAND = [-9.6, 36.9, -6.1, 42.2];
export const ES_NOT_PNOA = [[-2.98, 35.26, -2.92, 35.33]];
const inBox = ([x0, y0, x1, y1], lon, lat) => lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1;
export const ptKeys = (lon, lat) => (inBox(PT_MAINLAND, lon, lat) ? ["pt-25", "pt-21", "pt-18", "pt-sat"] : []);
export const esKeys = (lon, lat) => (ES_NOT_PNOA.some((b) => inBox(b, lon, lat)) ? [] : ["es"]);
// Cyprus (Bára 23. 11. 2026: "Orto vezměme to novější"): the DLS orthophoto of 2019 (a tile cache in Web Mercator to
// level 21, CORS echo; no licence stated, unlike the 2014 one, CC BY 4.0), only the south and the British bases (a
// missing tile is a 404 there). Level 20 (about 12 cm at 35° N).
export const CY_ORTHO = "https://eservices.dls.moi.gov.cy/arcgis/rest/services/BASEMAPS/Orthoimagery_2019_WebMercator/MapServer/tile";
// Malta (Bára 23. 11. 2026): the Planning Authority's orthophoto of 2018 (15 cm, WMS of wetransform, CORS *, CC BY 4.0),
// Malta, Gozo and Comino. The service has no Web Mercator: the box is asked in degrees (CRS:84, lon lat); over a cut's
// hundred metres a degree's image and a Mercator one differ by under a centimetre. Black beyond the islands.
const mercToDeg = ([x0, y0, x1, y1]) => [x0, y0, x1, y1].map((v, i) => (i % 2 === 0 ? (v / R) * (180 / Math.PI) : (Math.atan(Math.sinh(v / R)) * 180) / Math.PI));
export const MT_ORTHO = (b, w, h, format = "image/jpeg") => `https://malta.coverage.wetransform.eu/wms/ortho_2018/ows?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: "OI.OrthoimageCoverage", STYLES: "", CRS: "CRS:84", BBOX: mercToDeg(b).join(","), WIDTH: w, HEIGHT: h, FORMAT: format })}`;
// Italy (Bára 23. 11. 2026): only orthophotos with an open licence (CC BY 4.0, evaluation/italy/SOURCES.md), each with its
// box: Bologna 2023 and Modena 2024 (Emilia-Romagna's services), Turin 2023 (the Comune's), the province of Bolzano 2023
// (flown in collaboration with AGEA under the monitoring plan; the province's metadata license it CC BY 4.0, Bára
// 23. 11. 2026: use it). AGEA's own layers (the rest of Italy) are for institutional use only. All WMS in EPSG:3857 with
// CORS. Modena's box reaches 44.75 for the town's two northern exclaves (the review of 23. 11. 2026) and 10.77 for its
// western edge by ISTAT's border (tools/build_states.mjs).
// Turin's credit in the wording the Geoportale del Comune di Torino requires (its "Licenze d'uso", Bára 23. 11. 2026):
// "Base cartografica realizzata da [Licenziatario], integrata con [Livelli informativi o Servizi][data] della Città di
// Torino reperiti sul Geoportale del Comune di Torino", in Italian in every language, after "ortofoto {who}".
export const TO_ORTHO_WHO = "© Città di Torino (CC BY 4.0): Base cartografica realizzata da Bara Soukup, integrata con Ortofoto digitale colore 2023 della Città di Torino reperiti sul Geoportale del Comune di Torino";
const itWms = (base, layer) => (b, w, h, format = "image/jpeg") => `${base}?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: layer, STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: format })}`;
export const IT_ORTHO = {
  "it-bo": { box: [11.22, 44.42, 11.44, 44.56], url: itWms("https://servizigis.regione.emilia-romagna.it/wms/comune_bo_2023_rgb", "Comune_BO_2023_RGB"), credit: "credits.orthophotoComuneDiBologna" },
  "it-mo": { box: [10.77, 44.52, 11.03, 44.75], url: itWms("https://servizigis.regione.emilia-romagna.it/wms/comune_mo_2024_rgb", "Comune_MO_2024_RGB"), credit: "credits.orthophotoComuneDiModena" },
  "it-to": { box: [7.57, 44.99, 7.78, 45.15], url: itWms("https://geomap.reteunitaria.piemonte.it/mapproxy/service", "coto_ortofoto_2023"), who: TO_ORTHO_WHO },
  "it-bz": { box: [10.38, 46.21, 12.48, 47.10], url: itWms("https://geoservices.buergernetz.bz.it/mapproxy/wms", "p_bz-Orthoimagery:Aerial-2023-RGB"), credit: "credits.orthophotoProvinciaAutonomaDi", outside: inLombardy },
};
// The orthophotos of a point; a box's "outside" is the territory it overlaps and does not cover (Bolzano's box reaches
// into Lombardy: Ponte di Legno, Valfurva; the review of 24. 11. 2026).
export const itOrthoAt = (lon, lat) => Object.keys(IT_ORTHO).filter((k) => { const [x0, y0, x1, y1] = IT_ORTHO[k].box; return lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1 && !IT_ORTHO[k].outside?.(lon, lat); });
// Estonia (Bára 23. 11. 2026): the Land and Spatial Development Board's orthophoto as TMS tiles in Web Mercator (the y axis
// flipped; CORS *; its open-data licence of 1. 1. 2025), clean but only to level 18 (about 30 cm at 59° N). The WMS of
// full resolution (to 3 cm in Tallinn) carries a watermark on a 400 px grid that would read as lines (SOURCES.md).
export const EE_ORTHO = "https://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC";
export const SI_ORTHO = (b, w, h, format = "image/jpeg") => `https://ipi.eprostor.gov.si/wms-si-gurs-dts/wms?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: "SI.GURS.ZPDZ:DOF025_3857", STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: format })}`;
// Finland (Bára 23. 11. 2026): no national orthophoto without a key (the MML's needs a personal one, which would show in
// the browser; evaluation/finland/SOURCES.md 1), so only the towns' own WMS in Web Mercator with CORS *, each CC BY 4.0 on
// HRI / avoindata.fi (checked 23. 11. 2026): Helsinki's of 2026 (5 cm, a true orthophoto), Espoo's latest "Ortokartta"
// (about 30 cm) and Turku's true orthophoto of 2022 (5 cm; its layer of 2025 has no licence of its own published). Each
// only over its town's box (Helsinki first where the boxes overlap); elsewhere in Finland no orthophoto (laneImage null:
// the estimate from OSM).
const fiWms = (base, layer) => (b, w, h, format = "image/jpeg") => `${base}?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: layer, STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: format, ...(format === "image/png" && { TRANSPARENT: "TRUE" }) })}`;
export const FI_ORTHO = {
  "fi-hki": { box: [24.82, 60.125, 25.27, 60.305], res: 0.1, url: fiWms("https://kartta.hel.fi/ws/geoserver/avoindata/wms", "avoindata:Ortoilmakuva_2026_5cm"), credit: "credits.orthophotoHelsinginKaupunkiKaupunkimittauspalvel" },
  "fi-esp": { box: [24.50, 60.08, 24.85, 60.36], res: 0.3, url: fiWms("https://kartat.espoo.fi/teklaogcweb/wms.ashx", "Ortokartta"), credit: "credits.orthophotoEspoonKaupunkiCc" },
  "fi-tku": { box: [22.05, 60.33, 22.55, 60.62], res: 0.1, url: fiWms("https://turku.asiointi.fi/TeklaOGCWeb/WMS.ashx", "Ilmakuva 2022 True ortho"), credit: "credits.orthophotoTurunKaupunki2022" },
};
export const fiOrthoAt = (lon, lat) => Object.keys(FI_ORTHO).filter((k) => { const [x0, y0, x1, y1] = FI_ORTHO[k].box; return lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1; });
// The USA (Bára 24. 11. 2026, phase 2): DC's orthophoto of 2025 (OCTO, Ortho2025_WebMercator, a tile cache in Web Mercator
// to level 23, 7.5 cm at level 21; flown 27. 3. 2025, 8 cm; CORS for the origin asking; CC BY 4.0 by opendata.dc.gov,
// "Office of the Chief Technology Officer"), read through its export in Web Mercator, only inside the District (towns-us.json) and 60 m beyond it (the cache is white
// farther out). Elsewhere in the
// metro (Maryland, Virginia) no orthophoto yet: the estimate from OSM.
export const DC_ORTHO = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Ortho2025_WebMercator/MapServer";
const agsExport = (service) => (b, w, h, format = "image/jpeg") => `${service}/export?${new URLSearchParams({ bbox: b.join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: format === "image/png" ? "png32" : "jpg", ...(format === "image/png" && { transparent: "true" }), f: "image" })}`;
// New York City (26. 11. 2026): the orthophoto of the State of New York of 2024 (NYS ITS Geospatial Services, the 2024 flight
// over the five boroughs, 0.5 ft; a tile cache in Web Mercator to level 19, its export finer; CORS for the origin asking; "available
// at no cost", no licence stated: gis.ny.gov), only inside the city (towns-us.json) and 30 m beyond it.
export const NYS_ORTHO = "https://orthos.its.ny.gov/arcgis/rest/services/wms/2024/MapServer";
// Boston's metro (Bára 26. 11. 2026): MassGIS's spring orthophoto of 2025 (15 cm, a tile cache in Web Mercator to level
// 23 on ArcGIS Online, read at level 20 as {z}/{y}/{x}; CORS for the origin asking; "No restrictions apply to these data …
// Acknowledgement of MassGIS would be appreciated", the item's licence), over the metro (towns-us.json "bostonmetro").
export const MA_ORTHO = "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Aerial_Imagery_2025/MapServer/tile";
export const US_ORTHO = {
  "us-dc": { box: [-77.12, 38.79, -76.909, 38.997], town: "washington", near: 60, res: 0.1, url: agsExport(DC_ORTHO), credit: "credits.orthophotoDcOfficeChief" },
  "us-nyc": { box: [-74.27, 40.47, -73.68, 40.93], town: "newyork", near: 30, res: 0.15, url: agsExport(NYS_ORTHO), credit: "credits.orthophotoNysGeospatialServices" },
  "us-ma": { box: [-71.9, 41.98, -70.64, 42.74], town: "bostonmetro", near: 60, res: 0.15, tiles: MA_ORTHO, z: 20, px: 256, credit: "credits.orthophotoMassgisBureauGeographic" },
};
// Canada (Bára 25. 11. 2026): the City of Toronto's orthophoto of the current year (cot_ortho; 2025, 8 cm, a tile cache in Web
// Mercator to level 23; CORS for the origin asking; Open Government Licence – Toronto by the catalogue's "Web Map Services"),
// read as DC's, only inside the city (towns-ca.json) and 30 m beyond it. Around the city no orthophoto yet.
export const CA_ORTHO = {
  "ca-tor": { box: [-79.645, 43.575, -79.11, 43.86], town: "toronto", near: 30, res: 0.1, url: agsExport("https://gis.toronto.ca/arcgis/rest/services/basemap/cot_ortho/MapServer"), credit: "credits.orthophotoCityToronto2025" },
};
export const usOrthoAt = (lon, lat) => Object.keys(US_ORTHO).filter((k) => inArea(US_ORTHO[k], lon, lat));
export const caOrthoAt = (lon, lat) => Object.keys(CA_ORTHO).filter((k) => inArea(CA_ORTHO[k], lon, lat));
// The sources whose orthophotos cover only some towns, each by its box (Finland, the USA, Canada).
export const BOXED = { fi: fiOrthoAt, us: usOrthoAt, ca: caOrthoAt };
// Is there an orthophoto of the source (countries/<ISO>.js laneOrtho) at the point? "none" never; the states whose
// orthophotos cover only some towns (Italy, Finland) by their boxes; the others everywhere (a blank photo is found out
// when it comes). The question is the place's, not the state's (the review of 24. 11. 2026: in Lombardy the kerb model
// was loaded and the note said "orthophoto" where there is none).
export const orthoHereAt = (source, lon, lat) => !!source && source !== "none" && (SOURCES[source] || ["de", "be", "pt", "es", "it", ...Object.keys(BOXED)].includes(source)) && (source === "it" ? itOrthoAt(lon, lat).length > 0 : source === "pt" ? ptKeys(lon, lat).length > 0 : source === "es" ? esKeys(lon, lat).length > 0 : BOXED[source] ? BOXED[source](lon, lat).length > 0 : true);
// Denmark (Bára 23. 11. 2026): the spring orthophoto of GeoDanmark (Klimadatastyrelsen, "Ortofoto forår", 10–12.5 cm, a
// new national mosaic each spring) as WMTS tiles in Web Mercator to level 20 (DFD_GoogleMapsCompatible, about 8 cm a pixel
// in Copenhagen), CORS for the origin asking, free data with credit (evaluation/denmark/SOURCES.md 1). Only with the app's
// own token of Dataforsyningen (keys.js dkToken: config.js on the site from the repository variable DK_TOKEN, locally
// config.local.js); without it laneImage throws an error marked noKey (app.js: the estimate from OSM, said so), as it
// does when the service turns the token away (401/403 on every tile). Dataforsyningen is moving to a new platform (a
// service window 26.–30. 11. 2026): a server error is an outage, told as one.
// Composed by hand, not through URLSearchParams: Leaflet's layer passes "{z}", "{x}", "{y}" and replaces them itself, so
// they must stay unencoded (the review of 24. 11. 2026: encoded to %7Bz%7D, every basemap tile was a 400).
export const DK_ORTHO = (z, x, y, token = dkToken()) => "https://api.dataforsyningen.dk/orto_foraar_webm_DAF?service=WMTS&request=GetTile&version=1.0.0"
  + `&layer=orto_foraar_webm&style=default&format=image%2Fjpeg&tilematrixset=DFD_GoogleMapsCompatible&tilematrix=${z}&tilerow=${y}&tilecol=${x}&token=${encodeURIComponent(token ?? "")}`;
export const SK_ORTHO = "https://zbgis.skgeodesy.sk/zbgis/rest/services/Ortofoto_hres/MapServer";
export const SOURCES = {
  // The grid of z19, tiles of 512 px (about 10 cm). balance: the mosaic is bright and tinted (Košice 2025: asphalt
  // 200 bright and 10 greener than red and blue, read as grass), so the tints are taken relative to its grey pixels.
  sk: { res: 0.1, tiles: `${SK_ORTHO}/tile`, z: 19, px: 512, balance: true },
  // basemap.at has level 20 only in some towns (Vienna, Graz, Linz; Salzburg, Innsbruck, Klagenfurt, St. Pölten: 404,
  // found by the universal judging 17. 11. 2026): level 19 where a tile of 20 is missing.
  at: { res: 0.1, tiles: AT_ORTHO, z: 20, px: 256, ext: ".jpeg", fallback: "at19" },
  at19: { res: 0.1, tiles: AT_ORTHO, z: 19, px: 256, ext: ".jpeg" },
  ch: { res: 0.1, tiles: CH_ORTHO, z: 20, px: 256, ext: ".jpeg", xy: true },
  nl: { res: 0.1, tiles: NL_ORTHO, z: 20, px: 256, ext: ".jpeg", xy: true },
  pl: { res: 0.1, url: (b, w, h, format) => PL_ORTHO(b, w, h, format) },
  fr: { res: 0.2, url: (b, w, h, format) => FR_ORTHO(b, w, h, format) },
  es: { res: 0.25, url: (b, w, h, format) => ES_ORTHO(b, w, h, format) },
  "it-bo": { res: 0.15, url: (b, w, h, format) => IT_ORTHO["it-bo"].url(b, w, h, format) },
  "it-mo": { res: 0.15, url: (b, w, h, format) => IT_ORTHO["it-mo"].url(b, w, h, format) },
  "it-to": { res: 0.1, url: (b, w, h, format) => IT_ORTHO["it-to"].url(b, w, h, format) },
  "it-bz": { res: 0.2, url: (b, w, h, format) => IT_ORTHO["it-bz"].url(b, w, h, format) },
  ee: { res: 0.3, tiles: EE_ORTHO, z: 18, px: 256, ext: ".jpg", xy: true, tms: true },
  si: { res: 0.25, url: (b, w, h, format) => SI_ORTHO(b, w, h, format) },
  mt: { res: 0.15, url: (b, w, h, format) => MT_ORTHO(b, w, h, format) },
  cy: { res: 0.12, tiles: CY_ORTHO, z: 20, px: 256 },
  // Denmark: WMTS by key-value pairs (tileUrl in place of a path), only with a token (key).
  dk: { res: 0.1, tiles: "dk", tileUrl: DK_ORTHO, key: dkToken, z: 20, px: 256 },
  "pt-25": { res: 0.25, url: (b, w, h, format) => PT_ORTHO["pt-25"](b, w, h, format) },
  "pt-21": { res: 0.3, url: (b, w, h, format) => PT_ORTHO["pt-21"](b, w, h, format) },
  "pt-18": { res: 0.25, url: (b, w, h, format) => PT_ORTHO["pt-18"](b, w, h, format) },
  "pt-sat": { res: 0.3, url: (b, w, h, format) => PT_ORTHO["pt-sat"](b, w, h, format) },
  lu: { res: 0.1, tiles: LU_ORTHO, z: 20, px: 256, ext: ".jpeg", xy: true },
  brno: { res: 0.1, tiles: "https://gis.brno.cz/ags1/rest/services/OMI/OMI_basemaps_ortofoto_2025_wgs/MapServer/tile", z: 20, shift: [1.06, 3.09] },
  plzen: { res: 0.1, url: (b, w, h) => `https://ags.plzen.eu/arcgis/rest/services/Orto_2024_5cm_RGB_mimoveg/MapServer/export?${new URLSearchParams({ bbox: b.join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: "jpg", f: "image", datumTransformations: "[1623]" })}` },
  ipr: { res: 0.1, url: (b, w, h) => `https://gs-pub.praha.eu/imgs/rest/services/ort/letecke_snimkovani/ImageServer/exportImage?${new URLSearchParams({ bbox: b.join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: "jpg", f: "image" })}` },
  cuzk: { res: 0.125, url: (b, w, h, format = "image/jpeg") => `https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer?${new URLSearchParams({ service: "WMS", request: "GetMap", version: "1.3.0", layers: "0", styles: "", crs: "EPSG:3857", bbox: b.join(","), width: w, height: h, format })}` },
};
// The orthophotos of Germany's Länder: WMS 1.3.0 GetMap in EPSG:3857 (each answered with CORS and a photo, 17. 11. 2026),
// with the credit each asks for (its capabilities' Fees and AccessConstraints).
export const DE_ORTHO = {
  BW: { wms: "https://owsproxy.lgl-bw.de/owsproxy/ows/WMS_LGL-BW_ATKIS_DOP_20_C", layers: "IMAGES_DOP_20_RGB", credit: "© LGL-BW (dl-de/by-2-0)" },
  BY: { wms: "https://geoservices.bayern.de/od/wms/dop/v1/dop20", layers: "by_dop20c", credit: "© Bayerische Vermessungsverwaltung (CC BY 4.0)" },
  // Berlin and Brandenburg in one layer of the LGB.
  BE: { wms: "https://isk.geobasis-bb.de/mapproxy/dop20c/service/wms", layers: "bebb_dop20c", credit: "© GeoBasis-DE/LGB (dl-de/by-2-0)" },
  BB: { wms: "https://isk.geobasis-bb.de/mapproxy/dop20c/service/wms", layers: "bebb_dop20c", credit: "© GeoBasis-DE/LGB (dl-de/by-2-0)" },
  HB: { wms: "https://geodienste.bremen.de/wms_dop20_2023", layers: "DOP20_2023_HB,DOP20_2023_BHV", credit: "© Landesamt GeoInformation Bremen (CC BY 4.0)" },
  // The time series of Hamburg: 2024 asked by name (its 2022 is a satellite image under a closed licence).
  HH: { wms: "https://geodienste.hamburg.de/wms_dop_zeitreihe_belaubt", layers: "dop_zeitreihe_belaubt", time: "2024", credit: "© Freie und Hansestadt Hamburg, LGV (dl-de/by-2-0)" },
  HE: { wms: "https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-images.ows", layers: "he_dop20_rgb", credit: "© HVBG (dl-de/zero-2-0)" },
  MV: { wms: "https://www.geodaten-mv.de/dienste/adv_dop", layers: "mv_dop", credit: "© GeoBasis-DE/M-V (CC BY 4.0)" },
  NI: { wms: "https://opendata.lgln.niedersachsen.de/doorman/noauth/dop_wms", layers: "ni_dop20", credit: "© LGLN (CC BY 4.0)" },
  NW: { wms: "https://www.wms.nrw.de/geobasis/wms_nw_dop", layers: "nw_dop_rgb", credit: "© GeoBasis-DE/NRW (dl-de/zero-2-0)" },
  RP: { wms: "https://geo4.service24.rlp.de/wms/rp_dop20.fcgi", layers: "rp_dop20", credit: "© GeoBasis-DE/LVermGeoRP (dl-de/by-2-0)" },
  SH: { wms: "https://dienste.gdi-sh.de/WMS_SH_DOP20col_OpenGBD", layers: "sh_dop20_rgb", credit: "© GeoBasis-DE/LVermGeo SH (CC BY 4.0)" },
  SL: { wms: "https://geoportal.saarland.de/freewms/dop2023", layers: "sl_dop20_rgb", credit: "© GeoBasis DE/LVGL-SL (dl-de/by-2-0)" },
  SN: { wms: "https://geodienste.sachsen.de/wms_geosn_dop-rgb/guest", layers: "sn_dop_020", credit: "© GeoSN (dl-de/by-2-0)" },
  ST: { wms: "https://www.geodatenportal.sachsen-anhalt.de/wss/service/INSPIRE_LVermGeo_ATKIS_OI/guest", layers: "OI_OrthoimageCoverage", credit: "© GeoBasis-DE / LVermGeo ST (dl-de/by-2-0)" },
  TH: { wms: "https://www.geoproxy.geoportal-th.de/geoproxy/services/DOP", layers: "th_dop", credit: "© GDI-Th (CC BY 4.0)" },
};
export const deWmsUrl = ({ wms, layers, time }, b, w, h, format = "image/jpeg", extra = {}) => `${wms}?${new URLSearchParams({ service: "WMS", request: "GetMap", version: "1.3.0", layers, styles: "",
  crs: "EPSG:3857", bbox: b.join(","), width: w, height: h, format, ...(time && { time }), ...extra })}`;
for (const [r, o] of Object.entries(BE_ORTHO)) SOURCES[`be-${r}`] = { res: 0.1, url: o.url };
for (const [land, o] of Object.entries(DE_ORTHO)) SOURCES[`de-${land}`] = { res: 0.1, url: (b, w, h, format) => deWmsUrl(o, b, w, h, format) };
for (const [k, o] of Object.entries({ ...FI_ORTHO, ...US_ORTHO, ...CA_ORTHO })) SOURCES[k] = o.tiles ? { res: o.res, tiles: o.tiles, z: o.z, px: o.px } : { res: o.res, url: o.url };
// The URL of a tile: the source's own (tileUrl, WMTS by key-value pairs) or the path {z}/{y}/{x} (xy: {z}/{x}/{y}; tms: y
// from the bottom).
export const tileUrlOf = (src, tx, ty) => (src.tileUrl ? src.tileUrl(src.z, tx, ty) : `${src.tiles}/${src.z}/${src.xy ? `${tx}/${src.tms ? 2 ** src.z - 1 - ty : ty}` : `${ty}/${tx}`}${src.ext || ""}`);
