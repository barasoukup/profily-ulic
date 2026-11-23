// Lanes and shoulders from the orthophoto (Bára 11.–12. 11. 2026; evaluation/ortofoto/ZPRAVA.md): the road markings
// along the street split the carriageway, where the rules only divide it evenly. On a click one image of the
// orthophoto around the cut (±25 m, snapped to the source's pixels: Prague IPR 10 cm, Brno 2025 with its shift,
// Plzeň 2024, else ČÚZK 12.5 cm) is asked in parallel with the other sources; once the profile is derived, the
// lines running along each carriageway of the surface map are found and the profile's lanes and shoulders between
// them are redrawn (source "ortofoto"), and parking paved apart from the asphalt is split off. The map and these
// orthophotos agree within about 0.2 m, so the image is used as it is, without fitting.
// The detector (evaluation/ortofoto/cary.mjs m4, m5): per pixel "brighter than its row's surroundings", per column
// the share of such pixels along ±20 m in pieces of 5 m (a line repeats, an arrow does not), searched turned and
// bent (one direction and curve per carriageway), narrow peaks, solid or dashed by their gaps; then the lines whose
// gaps look like lanes, chosen together. Anything doubtful leaves the rules' profile as it is.

const R = 6378137, ALONG = 20, TIMEOUT = 4000, SI_PAUSE = 300;
const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
// Each city's best orthophoto (evaluation/ortofoto/ZPRAVA.md; the key: city.js laneOrtho of the city, else the state's,
// countries/<ISO>.js): Prague IPR 10 cm (summer 2024), Brno's 2025 (tiles of
// about 10 cm, shifted against ČÚZK by 1.06 m east and 3.09 m north: evaluation/ortofoto/posun.mjs), Plzeň's 2024
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
// Portugal (Bára 23. 11. 2026): DGT's orthophotos (WMS, EPSG:3857, CORS *, CC BY; evaluation/portugal/ZDROJE.md): the
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
// The mainland's box (staty.json "portugal": the mainland ring and the Berlengas): DGT has no photo on Madeira and the
// Azores, so they are not asked there (the review of 23. 11. 2026). Melilla's box (staty.json "spain"): PNOA has a
// Pléiades Neo image © Airbus DS there under a licence not yet cleared (evaluation/spain/ZDROJE.md 1): not read there.
export const PT_MAINLAND = [-9.6, 36.9, -6.1, 42.2];
export const ES_NOT_PNOA = [[-2.98, 35.26, -2.92, 35.33]];
const inBox = ([x0, y0, x1, y1], lon, lat) => lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1;
const ptKeys = (lon, lat) => (inBox(PT_MAINLAND, lon, lat) ? ["pt-25", "pt-21", "pt-18", "pt-sat"] : []);
const esKeys = (lon, lat) => (ES_NOT_PNOA.some((b) => inBox(b, lon, lat)) ? [] : ["es"]);
// Cyprus (Bára 23. 11. 2026: "Orto vezměme to novější"): the DLS orthophoto of 2019 (a tile cache in Web Mercator to
// level 21, CORS echo; no licence stated, unlike the 2014 one, CC BY 4.0), only the south and the British bases (a
// missing tile is a 404 there). Level 20 (about 12 cm at 35° N).
export const CY_ORTHO = "https://eservices.dls.moi.gov.cy/arcgis/rest/services/BASEMAPS/Orthoimagery_2019_WebMercator/MapServer/tile";
// Malta (Bára 23. 11. 2026): the Planning Authority's orthophoto of 2018 (15 cm, WMS of wetransform, CORS *, CC BY 4.0),
// Malta, Gozo and Comino. The service has no Web Mercator: the box is asked in degrees (CRS:84, lon lat); over a cut's
// hundred metres a degree's image and a Mercator one differ by under a centimetre. Black beyond the islands.
const mercToDeg = ([x0, y0, x1, y1]) => [x0, y0, x1, y1].map((v, i) => (i % 2 === 0 ? (v / R) * (180 / Math.PI) : (Math.atan(Math.sinh(v / R)) * 180) / Math.PI));
export const MT_ORTHO = (b, w, h, format = "image/jpeg") => `https://malta.coverage.wetransform.eu/wms/ortho_2018/ows?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: "OI.OrthoimageCoverage", STYLES: "", CRS: "CRS:84", BBOX: mercToDeg(b).join(","), WIDTH: w, HEIGHT: h, FORMAT: format })}`;
// Italy (Bára 23. 11. 2026): only orthophotos with an open licence (CC BY 4.0, evaluation/italy/ZDROJE.md), each with its
// box: Bologna 2023 and Modena 2024 (Emilia-Romagna's services), Turin 2023 (the Comune's), the province of Bolzano 2023
// (flown in collaboration with AGEA under the monitoring plan; the province's metadata license it CC BY 4.0, Bára
// 23. 11. 2026: use it). AGEA's own layers (the rest of Italy) are for institutional use only. All WMS in EPSG:3857 with
// CORS. Modena's box reaches 44.75 for the town's two northern exclaves (the review of 23. 11. 2026) and 10.77 for its
// western edge by ISTAT's border (tools/build_staty.mjs).
// Turin's credit in the wording the Geoportale del Comune di Torino requires (its "Licenze d'uso", Bára 23. 11. 2026):
// "Base cartografica realizzata da [Licenziatario], integrata con [Livelli informativi o Servizi][data] della Città di
// Torino reperiti sul Geoportale del Comune di Torino", in Italian in every language, after "ortofoto {who}".
export const TO_ORTHO_WHO = "© Città di Torino (CC BY 4.0): Base cartografica realizzata da Bara Soukup, integrata con Ortofoto digitale colore 2023 della Città di Torino reperiti sul Geoportale del Comune di Torino";
const itWms = (base, layer) => (b, w, h, format = "image/jpeg") => `${base}?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: layer, STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: format })}`;
export const IT_ORTHO = {
  "it-bo": { box: [11.22, 44.42, 11.44, 44.56], url: itWms("https://servizigis.regione.emilia-romagna.it/wms/comune_bo_2023_rgb", "Comune_BO_2023_RGB"), credit: "ortofoto © Comune di Bologna, Regione Emilia-Romagna (CC BY 4.0)" },
  "it-mo": { box: [10.77, 44.52, 11.03, 44.75], url: itWms("https://servizigis.regione.emilia-romagna.it/wms/comune_mo_2024_rgb", "Comune_MO_2024_RGB"), credit: "ortofoto © Comune di Modena, Regione Emilia-Romagna (CC BY 4.0)" },
  "it-to": { box: [7.57, 44.99, 7.78, 45.15], url: itWms("https://geomap.reteunitaria.piemonte.it/mapproxy/service", "coto_ortofoto_2023"), who: TO_ORTHO_WHO },
  "it-bz": { box: [10.38, 46.21, 12.48, 47.10], url: itWms("https://geoservices.buergernetz.bz.it/mapproxy/wms", "p_bz-Orthoimagery:Aerial-2023-RGB"), credit: "ortofoto © Provincia autonoma di Bolzano (CC BY 4.0)" },
};
export const itOrthoAt = (lon, lat) => Object.keys(IT_ORTHO).filter((k) => { const [x0, y0, x1, y1] = IT_ORTHO[k].box; return lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1; });
// Estonia (Bára 23. 11. 2026): the Land and Spatial Development Board's orthophoto as TMS tiles in Web Mercator (the y axis
// flipped; CORS *; its open-data licence of 1. 1. 2025), clean but only to level 18 (about 30 cm at 59° N). The WMS of
// full resolution (to 3 cm in Tallinn) carries a watermark on a 400 px grid that would read as lines (ZDROJE.md).
export const EE_ORTHO = "https://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC";
// Slovenia (Bára 23. 11. 2026): GURS's colour orthophoto DOF025 (25 cm) in its own Web Mercator pyramid (WMS of the
// Geodetska uprava RS, CORS *, CC BY 4.0; evaluation/slovenia/ZDROJE.md). The server answers within a second or hangs
// for 30 s and gives 504 (also inside Slovenia, at random; always beyond it, so the map's layer is kept inside, app.js
// insideOnly): laneImage asks a second time after a short pause when the first does not answer in half the time.
export const SI_ORTHO = (b, w, h, format = "image/jpeg") => `https://ipi.eprostor.gov.si/wms-si-gurs-dts/wms?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: "SI.GURS.ZPDZ:DOF025_3857", STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: format })}`;
// Finland (Bára 23. 11. 2026): no national orthophoto without a key (the MML's needs a personal one, which would show in
// the browser; evaluation/finland/ZDROJE.md 1), so only the towns' own WMS in Web Mercator with CORS *, each CC BY 4.0 on
// HRI / avoindata.fi (checked 23. 11. 2026): Helsinki's of 2026 (5 cm, a true orthophoto), Espoo's latest "Ortokartta"
// (about 30 cm) and Turku's true orthophoto of 2022 (5 cm; its layer of 2025 has no licence of its own published). Each
// only over its town's box (Helsinki first where the boxes overlap); elsewhere in Finland no orthophoto (laneImage null:
// the estimate from OSM).
const fiWms = (base, layer) => (b, w, h, format = "image/jpeg") => `${base}?${new URLSearchParams({ SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: layer, STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: format, ...(format === "image/png" && { TRANSPARENT: "TRUE" }) })}`;
export const FI_ORTHO = {
  "fi-hki": { box: [24.82, 60.125, 25.27, 60.305], res: 0.1, url: fiWms("https://kartta.hel.fi/ws/geoserver/avoindata/wms", "avoindata:Ortoilmakuva_2026_5cm"), credit: "ortofoto © Helsingin kaupunki, kaupunkimittauspalvelut (CC BY 4.0)" },
  "fi-esp": { box: [24.50, 60.08, 24.85, 60.36], res: 0.3, url: fiWms("https://kartat.espoo.fi/teklaogcweb/wms.ashx", "Ortokartta"), credit: "ortofoto © Espoon kaupunki (CC BY 4.0)" },
  "fi-tku": { box: [22.05, 60.33, 22.55, 60.62], res: 0.1, url: fiWms("https://turku.asiointi.fi/TeklaOGCWeb/WMS.ashx", "Ilmakuva 2022 True ortho"), credit: "ortofoto © Turun kaupunki, 2022 (CC BY 4.0)" },
};
export const fiOrthoAt = (lon, lat) => Object.keys(FI_ORTHO).filter((k) => { const [x0, y0, x1, y1] = FI_ORTHO[k].box; return lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1; });
export const SK_ORTHO = "https://zbgis.skgeodesy.sk/zbgis/rest/services/Ortofoto_hres/MapServer";
const SOURCES = {
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
for (const [k, o] of Object.entries(FI_ORTHO)) SOURCES[k] = { res: o.res, url: o.url };

// The Länder a point may lie in (laender.json): the one it is in first, then those within about 2 km (the boundaries
// are of 1 : 1 000 000), at most three.
let laender = null;
const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
// The Land a point lies in, strictly (no neighbours within 2 km), or null outside Germany.
export async function landAt(lon, lat) {
  await landsAt(lon, lat);
  const all = await laender;
  return Object.keys(all).find((code) => inRings(all[code], lon, lat)) ?? null;
}
export async function landsAt(lon, lat, json = null) {
  laender ??= json ? Promise.resolve(json) : (async () => {
    const url = new URL("./laender.json", import.meta.url);
    if (url.protocol === "file:") return JSON.parse((await import("node:fs")).readFileSync(url, "utf8"));
    const r = await fetch(url);
    if (!r.ok) throw new Error(`laender.json ${r.status}`);
    return r.json();
  })();
  // A file that did not load is asked again next time (the review: Germany without orthophoto until a reload).
  const all = await laender.catch((err) => { laender = null; throw err; }), d = 0.02, near = [[0, 0], [d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, -d], [d, -d], [-d, d]];
  const hits = Object.keys(all).map((code) => ({ code, n: near.findIndex(([dx, dy]) => inRings(all[code], lon + dx * 1.5, lat + dy)) })).filter((x) => x.n >= 0);
  return hits.sort((a, b) => a.n - b.n).slice(0, 3).map((x) => x.code);
}
// Belgium's regions (regions-be.json, tools/build_regions_be.mjs: bru, vl, wal): the one a point lies in first, then
// those within about 2 km (the language border is of 1 : 1 000 000).
let regionsBe = null;
export async function beRegionsAt(lon, lat, json = null) {
  regionsBe ??= json ? Promise.resolve(json) : (async () => {
    const url = new URL("./regions-be.json", import.meta.url);
    if (url.protocol === "file:") return JSON.parse((await import("node:fs")).readFileSync(url, "utf8"));
    const r = await fetch(url);
    if (!r.ok) throw new Error(`regions-be.json ${r.status}`);
    return r.json();
  })();
  const all = await regionsBe.catch((err) => { regionsBe = null; throw err; }), d = 0.02, near = [[0, 0], [d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, -d], [d, -d], [-d, d]];
  const hits = Object.keys(all).map((code) => ({ code, n: near.findIndex(([dx, dy]) => inRings(all[code], lon + dx * 1.5, lat + dy)) })).filter((x) => x.n >= 0);
  return hits.sort((a, b) => a.n - b.n).map((x) => x.code);
}
// The orthophoto of a Belgian region: Flanders' covers Brussels too.
const beOrthoOf = (region) => (region === "wal" ? "wal" : "vl");
// An image without the photo: outside the Land's coverage the services answer white (or black, or transparent).
function blank(img) {
  let n = 0, empty = 0;
  for (let o = 0; o < img.data.length; o += 4 * 37) {
    n++;
    const [r, g, b, a] = [img.data[o], img.data[o + 1], img.data[o + 2], img.data[o + 3]];
    if (a === 0 || (r > 250 && g > 250 && b > 250) || (r < 4 && g < 4 && b < 4)) empty++;
  }
  return empty > n * 0.5;
}

const median = (a) => { const b = a.filter((v) => !Number.isNaN(v)).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };

// ---------- the image: one request, sampled on the cut's grid (t across, u along) ----------
// t0, t1: the stretch across the cut wanted (m). Returns { source, st } or null (no answer in time, a bad image).
// st.L: the brightness per pixel; st.G: how much greener than red and blue it is, st.Y: how much yellower than blue,
// st.D: green less red (derive.js surfaceLook: grass, dry grass or paving beside a roadway read from the lines),
// st.S: the saturation (max less min of the channels; ortho-osm.js: does a column look like the roadway). decode: a PNG decoder for Node (no canvas there; the evaluation),
// which asks ČÚZK for a PNG.
export async function laneImage(opts) {
  // Belgium: Flanders' photo, else Wallonia's (a blank image outside a region's coverage is no photo).
  if (opts.source === "be") {
    const start = Date.now(), budget = opts.timeout ?? TIMEOUT;
    let lastError = null;
    // The region of the cut's centre first (the hostile review: a Flemish image half white at the language border).
    const regions = await beRegionsAt(...opts.frame.toLonLat(0, 0)).catch(() => ["vl", "wal"]);
    for (const r of [...new Set([...regions.map(beOrthoOf), "vl", "wal"])]) {
      const left = budget - (Date.now() - start);
      if (left < 500) break;
      try { const out = await laneImageOf(`be-${r}`, { ...opts, timeout: left }); if (out) return out; } catch (err) { lastError = err; }
    }
    if (lastError) throw lastError;
    return null;
  }
  // Italy: the open orthophoto whose box holds the cut (a blank image outside its town is none; a failure is told, as
  // in Belgium and Portugal).
  if (opts.source === "it") {
    let lastError = null;
    for (const key of itOrthoAt(...opts.frame.toLonLat(0, 0))) {
      try { const out = await laneImageOf(key, opts); if (out) return out; } catch (err) { lastError = err; }
    }
    if (lastError) throw lastError;
    return null;
  }
  // Finland: the town's orthophoto whose box holds the cut (none elsewhere; a blank image is none).
  if (opts.source === "fi") {
    let lastError = null;
    for (const key of fiOrthoAt(...opts.frame.toLonLat(0, 0))) {
      try { const out = await laneImageOf(key, opts); if (out) return out; } catch (err) { lastError = err; }
    }
    if (lastError) throw lastError;
    return null;
  }
  // Portugal: the newest flight that has a photo here (a white image is none).
  if (opts.source === "pt") {
    const start = Date.now(), budget = opts.timeout ?? TIMEOUT;
    let lastError = null;
    for (const key of ptKeys(...opts.frame.toLonLat(0, 0))) {
      const left = budget - (Date.now() - start);
      if (left < 500) break;
      try { const out = await laneImageOf(key, { ...opts, timeout: left }); if (out) return out; } catch (err) { lastError = err; }
    }
    if (lastError) throw lastError;
    return null;
  }
  // Slovenia: GURS's server hangs now and then (a 504 after 30 s): half the time for the first request, then one more
  // after a short pause (a failure of both is told, as in Belgium and Portugal).
  if (opts.source === "si") {
    const start = Date.now(), budget = opts.timeout ?? TIMEOUT;
    try {
      return await laneImageOf("si", { ...opts, timeout: Math.max(1500, budget / 2) });
    } catch (err) {
      const left = budget - (Date.now() - start) - SI_PAUSE;
      if ((!err?.outage && !["TimeoutError", "AbortError"].includes(err?.name)) || left < 1000) throw err;
      await new Promise((r) => setTimeout(r, SI_PAUSE));
      return laneImageOf("si", { ...opts, timeout: left });
    }
  }
  if (opts.source === "es" && !esKeys(...opts.frame.toLonLat(0, 0)).length) return null;
  if (opts.source !== "de") return laneImageOf(SOURCES[opts.source] ? opts.source : "cuzk", opts);
  // Germany (countries/DE.js laneOrtho "de"): the Land's orthophoto, near a border the next Land's when the first has no
  // photo there, all within one timeout (the review of Germany).
  const tried = new Set(), start = Date.now(), budget = opts.timeout ?? TIMEOUT;
  let lastError = null;
  for (const land of await landsAt(...opts.frame.toLonLat(0, 0)).catch(() => [])) {
    if (tried.has(DE_ORTHO[land].wms)) continue; // Berlin and Brandenburg: one service
    tried.add(DE_ORTHO[land].wms);
    const left = budget - (Date.now() - start);
    if (left < 500) break;
    try {
      const out = await laneImageOf(`de-${land}`, { ...opts, timeout: left });
      if (out) return out;
    } catch (err) { lastError = err; }
  }
  if (lastError) throw lastError;
  return null;
}
async function laneImageOf(key, { frame, dir, t0, t1, timeout = TIMEOUT, fetchImpl = fetch, decode = null }) {
  const src = SOURCES[key], normal = [-dir[1], dir[0]];
  const k = Math.cos((frame.toLonLat(0, 0)[1] * Math.PI) / 180);
  // A point on the ground is read where the image shows it: moved by the orthophoto's shift (Web Mercator metres).
  const [sx, sy] = (src.shift || [0, 0]).map((v) => v / k);
  const at = (t, u) => { const [mx, my] = merc(...frame.toLonLat(normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u)); return [mx + sx, my + sy]; };
  const corners = [];
  for (const t of [t0, t1]) for (const u of [-ALONG, ALONG]) corners.push(at(t, u));
  // The box snapped to the source's pixel grid (in Web Mercator metres), so a place gets the same pixels however
  // the cut lies around it.
  const px = src.res / k, snap = (v, up) => (up ? Math.ceil(v / px) : Math.floor(v / px)) * px;
  let x0 = snap(Math.min(...corners.map((c) => c[0])), false), x1 = snap(Math.max(...corners.map((c) => c[0])), true);
  let y0 = snap(Math.min(...corners.map((c) => c[1])), false), y1 = snap(Math.max(...corners.map((c) => c[1])), true);
  const w = Math.round(((x1 - x0) * k) / src.res), h = Math.round(((y1 - y0) * k) / src.res);
  if (w > 2000 || h > 2000) return null;
  try {
    let img;
    if (src.tiles) {
      // XYZ tiles of Web Mercator, glued on a canvas; the bbox becomes the tiles' own.
      const size = (2 * Math.PI * R) / 2 ** src.z;
      const tx0 = Math.floor((x0 + Math.PI * R) / size), tx1 = Math.floor((x1 + Math.PI * R) / size);
      const ty0 = Math.floor((Math.PI * R - y1) / size), ty1 = Math.floor((Math.PI * R - y0) / size);
      if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 30) return null;
      const tp = src.px || 256; // pixels of a tile
      const canvas = new OffscreenCanvas((tx1 - tx0 + 1) * tp, (ty1 - ty0 + 1) * tp), g = canvas.getContext("2d");
      const signal = AbortSignal.timeout(timeout), jobs = [];
      // A server error on every tile is an outage (app.js says so), not an empty image.
      let down = 0, missing = 0;
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) jobs.push(fetchImpl(`${src.tiles}/${src.z}/${src.xy ? `${tx}/${src.tms ? 2 ** src.z - 1 - ty : ty}` : `${ty}/${tx}`}${src.ext || ""}`, { signal }).then(async (r) => { if (r.ok) g.drawImage(await createImageBitmap(await r.blob()), (tx - tx0) * tp, (ty - ty0) * tp, tp, tp); else if (r.status >= 500) down++; else missing++; }));
      await Promise.all(jobs);
      if (jobs.length && down === jobs.length) throw Object.assign(new Error(`ortofoto ${down}× 5xx`), { outage: true });
      if (missing && src.fallback) return laneImageOf(src.fallback, { frame, dir, t0, t1, timeout, fetchImpl, decode });
      img = g.getImageData(0, 0, canvas.width, canvas.height);
      x0 = tx0 * size - Math.PI * R; x1 = (tx1 + 1) * size - Math.PI * R; y1 = Math.PI * R - ty0 * size; y0 = Math.PI * R - (ty1 + 1) * size;
    } else {
      const r = await fetchImpl(src.url([x0, y0, x1, y1], w, h, decode ? "image/png" : undefined), { signal: AbortSignal.timeout(timeout) });
      if (!r.ok) { if (r.status >= 500) throw Object.assign(new Error(`ortofoto ${r.status}`), { outage: true }); return null; } // a server error: an outage
      if (decode) {
        const png = await decode(await r.arrayBuffer());
        img = { width: png.width, height: png.height, data: png.rgba };
      } else {
        const bmp = await createImageBitmap(await r.blob());
        const canvas = new OffscreenCanvas(bmp.width, bmp.height), g = canvas.getContext("2d");
        g.drawImage(bmp, 0, 0);
        img = g.getImageData(0, 0, bmp.width, bmp.height);
      }
    }
    // Outside a Land's coverage its WMS answers white (only the German sources).
    if ((key.startsWith("de-") || key.startsWith("be-") || key.startsWith("pt-") || key === "mt" || key.startsWith("it-") || key.startsWith("fi-")) && blank(img)) return null;
    // Resample on the grid of the cut.
    const res = src.res, nt = Math.round((t1 - t0) / res), nu = Math.round((2 * ALONG) / res), L = new Float32Array(nt * nu), G = new Float32Array(nt * nu), Y = new Float32Array(nt * nu), D = new Float32Array(nt * nu), S = new Float32Array(nt * nu);
    for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) {
      const [mx, my] = at(t0 + (i + 0.5) * res, ALONG - (j + 0.5) * res);
      const px = Math.floor(((mx - x0) / (x1 - x0)) * img.width), py = Math.floor(((y1 - my) / (y1 - y0)) * img.height);
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) { L[j * nt + i] = G[j * nt + i] = Y[j * nt + i] = D[j * nt + i] = S[j * nt + i] = NaN; continue; }
      const o = (py * img.width + px) * 4;
      L[j * nt + i] = 0.299 * img.data[o] + 0.587 * img.data[o + 1] + 0.114 * img.data[o + 2];
      const [r, g, b] = [img.data[o], img.data[o + 1], img.data[o + 2]];
      G[j * nt + i] = g - (r + b) / 2;
      Y[j * nt + i] = (r + g) / 2 - b;
      D[j * nt + i] = g - r;
      S[j * nt + i] = Math.max(r, g, b) - Math.min(r, g, b);
    }
    if (src.balance) balance(G, Y, D, S);
    return { source: key, st: { nt, nu, res, t0, L, G, Y, D, S, fine: key !== "cuzk" } };
  } catch (e) {
    // The server did not answer (a server error, the network, the timeout): an outage, passed on for app.js to say
    // (Bára 16. 11. 2026); anything else (an image that would not decode) is just no image, as before.
    if (e?.outage || e?.name === "TypeError" || e?.name === "TimeoutError" || e?.name === "AbortError") throw e;
    return null;
  }
}

// A grey world for a tinted mosaic: the median tint of the greyish pixels (saturation under 40: asphalt, paving,
// roofs) is no tint; strong colours (lawns, treetops) keep theirs.
function balance(G, Y, D, S) {
  const g = [], y = [], d = [];
  for (let q = 0; q < G.length; q += 5) if (S[q] < 40) { g.push(G[q]); y.push(Y[q]); d.push(D[q]); }
  if (g.length < 100) return;
  const [mg, my, md] = [median(g), median(y), median(d)];
  for (let q = 0; q < G.length; q++) { G[q] -= mg; Y[q] -= my; D[q] -= md; }
}

// ---------- the lines ----------
const FAINT = 0.55, LONG = 0.3, WEAK = 0.05, REL = 0.14, MIN_DL = 10, SHARE = 0.1, MAX_W = 0.6, BLOCKS = 8, MIN_SPREAD = 3, WIDER = 1.5;
const CURVES = [0, 1 / 200, -1 / 200, 1 / 100, -1 / 100, 1 / 50, -1 / 50]; // 1/R: the street may bend (Bára)
// Pixels brighter than the median of their row's surroundings (±0.75 m) by REL of it; the value is by how much
// (paint stands out about twice as much as worn, lighter asphalt).
export function brightMap(st) {
  const { nt, nu, res, L } = st, win = Math.max(2, Math.round(0.75 / res)), H = new Uint8Array(nt * nu), step = Math.max(1, win >> 2);
  for (let j = 0; j < nu; j++) for (let i = win; i < nt - win; i++) {
    const v = L[j * nt + i];
    if (Number.isNaN(v)) continue;
    const around = [];
    for (let d = -win; d <= win; d += step) if (Math.abs(d) > 1) around.push(L[j * nt + i + d]);
    const m = median(around);
    if (v - m > Math.max(MIN_DL, REL * m)) H[j * nt + i] = Math.min(255, Math.round(v - m));
  }
  return H;
}
function shareCurve(st, H, s, e, tan, k) {
  const { nt, nu, res, t0 } = st;
  const i0 = Math.max(0, Math.floor((s - WIDER - t0) / res)), i1 = Math.min(nt - 1, Math.floor((e + WIDER - t0) / res));
  const out = [];
  for (let i = i0; i <= i1; i++) {
    let n = 0, hit = 0, dl = 0;
    const bk = new Array(BLOCKS).fill(0), bn = new Array(BLOCKS).fill(0);
    for (let j = 0; j < nu; j++) {
      const u = ALONG - (j + 0.5) * res, ii = i + Math.round((u * tan + (k * u * u) / 2) / res);
      if (ii < 0 || ii >= nt || Number.isNaN(st.L[j * nt + ii])) continue;
      n++;
      const b = Math.min(BLOCKS - 1, Math.floor((j / nu) * BLOCKS));
      bn[b]++;
      if (H[j * nt + ii]) { hit++; bk[b]++; dl += H[j * nt + ii]; }
    }
    out.push({ t: t0 + (i + 0.5) * res, v: n ? hit / n : 0, dl: hit ? dl / hit : 0, spread: bk.filter((x, q) => bn[q] && x / bn[q] >= 0.1).length });
  }
  return out;
}
function peaks(share, res, min = SHARE, minSpread = MIN_SPREAD) {
  const out = [], sep = Math.round(0.3 / res);
  for (let k = 0; k < share.length; k++) {
    const v = share[k].v;
    if (v < min) continue;
    let top = true;
    for (let q = Math.max(0, k - sep); q <= Math.min(share.length - 1, k + sep); q++) if (share[q].v > v || (share[q].v === v && q < k)) { top = false; break; }
    if (!top) continue;
    let a = k, e = k;
    while (a > 0 && share[a - 1].v >= v / 2) a--;
    while (e + 1 < share.length && share[e + 1].v >= v / 2) e++;
    if ((e - a + 1) * res > MAX_W) continue;
    const ring = share.slice(Math.max(0, k - 2 * sep), Math.min(share.length, k + 2 * sep + 1)).map((x) => x.v);
    if (v - Math.min(...ring) < min * 0.8) continue;
    if (Math.max(...share.slice(a, e + 1).map((x) => x.spread)) < minSpread) continue;
    out.push({ t: share[k].t, share: v, dl: share[k].dl });
  }
  return out;
}
// Is the line at t dashed: along it, at least three dashes (runs of paint from 0.8 m, gaps of 0.3 m closed; the
// inner ones of about one length), with gaps from 1 m of about one length between them. A worn solid line breaks into short bits, one
// hidden by parked cars into irregular pieces.
function dashed(st, H, t, tan, k) {
  const { nt, nu, res, t0 } = st, i = Math.round((t - t0) / res - 0.5);
  const on = [];
  for (let j = 0; j < nu; j++) {
    const u = ALONG - (j + 0.5) * res, ii = i + Math.round((u * tan + (k * u * u) / 2) / res);
    on.push(ii >= 0 && ii < nt && (H[j * nt + ii] || (ii > 0 && H[j * nt + ii - 1]) || (ii + 1 < nt && H[j * nt + ii + 1])) ? 1 : 0);
  }
  const close = Math.round(0.3 / res);
  for (let j = 0, last = -Infinity; j < nu; j++) if (on[j]) { if (j - last > 1 && j - last <= close) for (let q = last + 1; q < j; q++) on[q] = 1; last = j; }
  const runs = [];
  for (let j = 0; j < nu;) { let q = j; while (q < nu && on[q] === on[j]) q++; runs.push({ on: on[j], len: (q - j) * res, inner: j > 0 && q < nu }); j = q; }
  const dash = runs.filter((r) => r.on && r.len >= 0.8).map((r) => r.len), gap = runs.filter((r) => !r.on && r.inner && r.len >= 1).map((r) => r.len);
  if (dash.length < 3 || gap.length < 2) return false;
  const even = (v) => { const m = v.reduce((a, x) => a + x, 0) / v.length; return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length) <= 0.45 * m; };
  return even(dash.slice(1, -1).length >= 2 ? dash.slice(1, -1) : dash) && even(gap);
}
// The lines of one carriageway [s, e]: one direction and bend for all of them (the sharpest share curve).
function linesOf(st, H, s, e) {
  let best = null;
  for (let deg = -3; deg <= 3 + 1e-9; deg += 0.5) for (const k of CURVES) {
    const sh = shareCurve(st, H, s, e, Math.tan((deg * Math.PI) / 180), k);
    const q = sh.reduce((a, x) => a + x.v * x.v, 0);
    if (!best || q > best.q) best = { q, sh, tan: Math.tan((deg * Math.PI) / 180), k };
  }
  // On a city's orthophoto (10 cm, paint fills its pixels) a line standing out less than FAINT of the carriageway's
  // strongest long line is worn, lighter asphalt between the wheel tracks, not paint (Jateční, Plzeň). On ČÚZK's
  // 12.5 cm a thin edge line looks as faint (Bohumínská), so there it stays.
  // Lines mostly hidden (a lorry over a dashed line: Poděbradská) come too, weak: they count only by how much
  // more than WEAK of them is seen, so they only win where the lanes do not fit without them.
  const strong = best ? peaks(best.sh, st.res) : [];
  const weak = best ? peaks(best.sh, st.res, WEAK, 2).filter((m) => m.share < SHARE).map((m) => ({ ...m, weak: true })) : [];
  const found = [...strong, ...weak].sort((a, b) => a.t - b.t).map((m) => ({ ...m, dashed: dashed(st, H, m.t, best.tan, best.k) }));
  if (!st.fine) return found;
  const top = Math.max(0, ...found.filter((m) => m.share >= LONG).map((m) => m.dl));
  return found.filter((m) => m.dl >= FAINT * top);
}
// Strong lines anywhere across [s, e] (ortho-osm.js: an edge line V 4 lies just inside a kerb): their offsets.
export const strongLines = (st, s, e, min = 0.3) => linesOf(st, brightMap(st), s, e).filter((m) => m.share >= min).map((m) => m.t);
// Of those inside the carriageway, the set whose gaps look like lanes (2.5–4.75 m; at the kerbs 1–7.5 m for a
// shoulder; a gap of two lanes whose line is missing with a small penalty), the most line strength.
const LANE_MIN = 2.5, LANE_MAX = 4.75, OUTER_MIN = 1, OUTER_MAX = 7.5, MISSED = 0.1, EDGE_MIN = 0.1, EDGE_SHARE = 0.5, DASHED_MAX = 0.6;
export function laneLines(st, H, s, e) {
  const all = linesOf(st, H, s, e), c = all.filter((m) => m.t > s + 0.7 && m.t < e - 0.7), n = c.length;
  const best = new Array(n).fill(-Infinity), prev = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    const first = c[i].t - s;
    const own = (m) => m.share - (m.weak ? WEAK : 0);
    if (first >= OUTER_MIN && first <= OUTER_MAX + LANE_MAX) best[i] = own(c[i]) - (first > OUTER_MAX ? MISSED : 0);
    for (let q = 0; q < i; q++) {
      const g = c[i].t - c[q].t, v = best[q] + own(c[i]) - (g > LANE_MAX ? MISSED : 0);
      if (g >= LANE_MIN && g <= 2 * LANE_MAX && v > best[i]) { best[i] = v; prev[i] = q; }
    }
  }
  let end = -1, top = 0;
  for (let i = 0; i < n; i++) { const last = e - c[i].t, v = best[i] - (last > OUTER_MAX ? MISSED : 0); if (last >= OUTER_MIN && last <= OUTER_MAX + LANE_MAX && v > top) { top = v; end = i; } }
  const chain = [];
  for (let i = end; i >= 0; i = prev[i]) chain.unshift(c[i]);
  // The edge lines close to the kerbs (a narrow shoulder, even 20 cm: Bára): a solid line within EDGE_NEAR of a kerb,
  // a lane's width from the next line.
  if (!chain.length) return [];
  const edge = (lo, hi) => all.filter((m) => m.t > lo && m.t < hi && m.share >= EDGE_SHARE).sort((a, b) => b.share - a.share)[0];
  const a = edge(s + EDGE_MIN, Math.min(s + 1, chain[0].t - LANE_MIN)), b = edge(Math.max(e - 1, chain.at(-1).t + LANE_MIN), e - EDGE_MIN);
  if (a) chain.unshift(a);
  if (b) chain.push(b);
  // The positions, and which of them are solid lines (true: an edge line, also one broken by short gaps, over
  // DASHED_MAX of its length, at a slip road: Rozvadovská spojka; false: dashed with long gaps, dividing lanes, or a
  // line mostly hidden, which an edge line is not; undefined: a faint line, not known).
  const out = chain.map((m) => m.t);
  out.solid = chain.map((m) => (m.weak || (m.dashed && m.share < DASHED_MAX) ? false : m.share >= EDGE_SHARE ? true : undefined));
  return out;
}

// ---------- parking on its own surface ----------
// Parking bays paved differently from the roadway (paving stones beside asphalt: Konopná, Plzeň; Bára): a band at
// a kerb, BAND_MIN–BAND_MAX wide, whose columns differ from the middle of the carriageway in brightness and are far
// more uneven (the stones, the cars on them), while the middle is smooth asphalt. Returns its width or 0.
const BAND_MIN = 1.6, BAND_MAX = 2.8, LANE_LEFT = 2.75;
function surfaceBand(st, s, e, side) {
  const { nt, nu, res, t0, L } = st, col = (t) => {
    const i = Math.round((t - t0) / res - 0.5), v = [];
    for (let j = 0; j < nu; j++) { const x = L[j * nt + i]; if (!Number.isNaN(x)) v.push(x); }
    v.sort((a, b) => a - b);
    return v.length < nu / 2 ? null : { med: v[v.length >> 1], iqr: v[(3 * v.length) >> 2] - v[v.length >> 2] };
  };
  const cols = [];
  for (let t = s + res / 2; t < e; t += res) cols.push({ t, ...col(t) });
  if (cols.some((c) => c.med === undefined)) return 0;
  const core = cols.filter((c) => c.t > s + (e - s) / 3 && c.t < e - (e - s) / 3);
  const coreMed = median(core.map((c) => c.med)), coreIqr = median(core.map((c) => c.iqr));
  if (!(coreIqr < 20)) return 0; // shade or cars over the middle: no smooth roadway to compare with
  const odd = (c) => Math.abs(c.med - coreMed) >= 0.08 * coreMed && c.iqr >= 3 * coreIqr + 8;
  const seq = side === "s" ? cols : [...cols].reverse(), from = (c) => Math.abs(c.t - (side === "s" ? s : e));
  let end = 0, miss = 0, hits = 0, n = 0;
  for (const c of seq) {
    if (from(c) < 0.2) continue; // the kerb itself
    if (from(c) > BAND_MAX + 0.5) break;
    n++;
    if (odd(c)) { hits++; miss = 0; end = from(c) + res / 2; } else if (++miss >= Math.round(0.3 / res)) break;
  }
  return end >= BAND_MIN && end <= BAND_MAX && hits >= 0.8 * (end - 0.2) / res && (e - s) - end >= LANE_LEFT ? end : 0;
}
// Splits a lane of the profile at a carriageway's kerb into parking on its own surface and the rest. Returns the
// number of bands found.
function parkingBands(result, st, carriages) {
  let found = 0;
  for (const c of carriages) {
    if (c.s <= st.t0 || c.e >= st.t0 + st.nt * st.res) continue;
    for (const side of ["s", "e"]) {
      const w = surfaceBand(st, c.s, c.e, side);
      if (!w) continue;
      // The profile's part at that kerb (laid from extent[0] up, as below).
      let t = result.extent[0], at = null;
      for (const seg of [...result.segments].reverse()) {
        const ps = t, pe = t + seg.width;
        t = pe;
        const edge = side === "s" ? c.s + 0.1 : c.e - 0.1;
        if (edge >= ps && edge <= pe) { at = seg; break; }
      }
      if (!at || at.type !== "pruh" || at.width < w + LANE_LEFT) continue;
      const i = result.segments.indexOf(at), park = { type: "parkovani", width: +w.toFixed(2), source: "ortofoto", orient: "podelne" };
      at.width = +(at.width - park.width).toFixed(2);
      // Screen order runs from extent[1] down: the low kerb (s) comes after the lane, the high one (e) before.
      result.segments.splice(side === "s" ? i + 1 : i, 0, park);
      found++;
    }
  }
  return found;
}

// ---------- the profile ----------
// Why a carriageway was left as the rules drew it (evaluation only: globalThis.__lanesWhy, an array, collects
// { s, e, why }; nothing happens in the app).
let lastWhy = "";
const why = (c, text) => globalThis.__lanesWhy?.push({ s: c.s, e: c.e, why: text });
const fail = (text) => { lastWhy = text; return null; };

const CARRIAGE = (c) => c === 700 || c === 701 || c === 704 || (c >= 9700 && c < 9800);
const RAISED = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "predzahradka", "zelen", "stromorad", "nastupiste", "cyklostezka", "tramvaj", "delici", "plocha", "zahradka", "voda", "zed", "nezname"]);
const BLOCK = new Set(["pruh", "krajnice"]);
const SNAP = 0.6;
const SHOULDER_MAX = 3.6; // a boundary of other parts (parking, bike lane…) moves to a line this near

// result: deriveProfile's { segments, runs, extent }; img: laneImage(). Returns the number of carriageways changed
// (the segments are changed in place).
export function applyLanes(result, img) {
  if (!img || !result?.segments?.length || !result.runs?.length || !result.extent) return 0;
  const H = brightMap(img.st);
  const mapped = [];
  for (const r of result.runs) {
    if (!CARRIAGE(r.code)) continue;
    const last = mapped.at(-1);
    if (last && Math.abs(last.e - r.s) < 0.05) last.e = r.e; else mapped.push({ s: r.s, e: r.e });
  }
  const bands = parkingBands(result, img.st, mapped);
  // The profile's parts with their positions, and its roadways (runs of parts at road level). The segments are in
  // screen order, from extent[1] down to extent[0] (derive.js), the runs along the cut: the parts are laid from
  // extent[0] up.
  let t = result.extent[0];
  const parts = [...result.segments].reverse().map((s) => { const o = { seg: s, s: t, e: t + s.width }; t += s.width; return o; });
  const ways = [];
  for (const p of parts) {
    if (RAISED.has(p.seg.type)) continue;
    const last = ways.at(-1);
    if (last && Math.abs(last.e - p.s) < 0.01) { last.e = p.e; last.parts.push(p); } else ways.push({ s: p.s, e: p.e, parts: [p] });
  }
  const carriages = [];
  for (const r of result.runs) {
    if (!CARRIAGE(r.code)) continue;
    const last = carriages.at(-1);
    if (last && Math.abs(last.e - r.s) < 0.05) last.e = r.e; else carriages.push({ s: r.s, e: r.e });
  }
  let changed = 0;
  const out = [];
  for (const w of ways) {
    // The carriageway of the map the roadway overlaps most; the profile's positions stretched onto it.
    const over = (c) => Math.max(0, Math.min(c.e, w.e) - Math.max(c.s, w.s));
    const c = carriages.reduce((b, x) => (over(x) > (b ? over(b) : 0) ? x : b), null);
    if (!c || over(c) < 0.5 * (w.e - w.s) || c.s <= img.st.t0 || c.e >= img.st.t0 + img.st.nt * img.st.res) { why(c || w, "bez vozovky / mimo snímek"); continue; }
    const found = laneLines(img.st, H, c.s, c.e);
    if (!found.length) { why(c, "žádné čáry"); continue; }
    // Only lanes and shoulders: the lanes as measured on the map's carriageway, what the profile has more or less
    // (its roadway is wider or narrower than the map's) goes to a shoulder. Else the lines are stretched onto the
    // profile and only move its boundaries.
    const k = (w.e - w.s) / (c.e - c.s), toProfile = (g) => w.s + (g - c.s) * k;
    const segs = w.parts.every((p) => BLOCK.has(p.seg.type)) ? measured(w, c, found, found.solid, img.st.fine) : redraw(w, found.map(toProfile), img.st.fine);
    if (segs) { out.push({ w, segs }); changed++; why(c, "změněno"); } else why(c, lastWhy || "zamítnuto");
    lastWhy = "";
  }
  // Put the new parts in place of the roadways' old ones (back in screen order).
  for (const { w, segs } of out) {
    const i = result.segments.indexOf(w.parts.at(-1).seg);
    result.segments.splice(i, w.parts.length, ...segs.reverse());
  }
  return changed + bands;
}

// A roadway of only lanes and shoulders, laid on the map's carriageway c: pieces between the kerbs and the lines.
function measured(w, c, lines, solid = [], fine = true) {
  const cuts = [c.s, ...lines, c.e], pieces = cuts.slice(1).map((x, q) => ({ s: cuts[q], e: x, w: x - cuts[q] }));
  // At a kerb a piece under LANE_MIN is a shoulder, but behind a dashed line it belongs to the lane: a lane being
  // added widens there (Jedovnická; Bára).
  const kerbLine = (q) => (q === 0 ? solid[0] : solid[lines.length - 1]);
  const kinds = pieces.map((p, q) => ((q === 0 || q === pieces.length - 1) && (p.w < EDGE_MIN || (p.w < LANE_MIN && kerbLine(q) === false)) ? "join" : (q === 0 || q === pieces.length - 1) && p.w < LANE_MIN ? "krajnice" : p.w >= LANE_MIN && p.w <= LANE_MAX ? "pruh" : null));
  // A lane-wide piece between two solid lines with lanes on both sides is a paved median, not a lane (Brněnská: a
  // crash barrier between edge lines; Bára).
  // Only one such piece, and only where it would be a lane more than the rules had: solid lines between all the
  // lanes (Barrandovský most, 4 lanes each way) are no median (report of 14. 11. 2026).
  const had = w.parts.filter((p) => p.seg.type === "pruh").length;
  const median = [];
  for (let q = 1; q < pieces.length - 1; q++) {
    if (kinds[q] === "pruh" && solid[q - 1] && solid[q] && kinds[q - 1] !== "krajnice" && kinds[q + 1] !== "krajnice") median.push(q);
  }
  if (median.length === 1 && kinds.filter((k) => k === "pruh").length > had) kinds[median[0]] = "stred";
  // A piece of two lanes whose dashed line was not found (a car on it: Olomoucká) is two lanes, while that does not
  // give more lanes than the rules had.
  for (let q = pieces.length - 1; q >= 0; q--) {
    const p = pieces[q];
    if (kinds[q] !== null || p.w < 2 * LANE_MIN || p.w > 2 * LANE_MAX) continue;
    const lanes = kinds.filter((k, i) => k === "pruh" || (k === null && i !== q)).length + 2;
    if (lanes > had) continue;
    const m = (p.s + p.e) / 2;
    pieces.splice(q, 1, { s: p.s, e: m, w: m - p.s }, { s: m, e: p.e, w: p.e - m });
    kinds.splice(q, 1, "pruh", "pruh");
  }
  // A piece at a kerb wider than a lane, where the rules had a shoulder, is a lane and the shoulder behind an edge
  // line the detector missed (Kukulova, Čuprova, Plzeňská, Kladská; 15 of 117 marked carriageways were left as the
  // rules had them, 16. 11. 2026): the lane as wide as the others found here (else 3.5 m), the shoulder the rest, an
  // estimate. A wide lane between two lines was tried too and gave fewer right lane counts.
  const lanesHere = pieces.filter((p, q) => kinds[q] === "pruh").map((p) => p.w).sort((x, y) => x - y);
  const usual = Math.min(4.25, Math.max(3, lanesHere.length ? lanesHere[lanesHere.length >> 1] : 3.5));
  for (let q = pieces.length - 1; q >= 0; q--) {
    const p = pieces[q], kerb = q === 0 || q === pieces.length - 1;
    if (kinds[q] !== null) continue;
    const ruled = (q === 0 ? w.parts[0] : w.parts.at(-1)).seg.type === "krajnice";
    // ...and only while that gives no more lanes than the rules had (Brno: 4.85 m was a lane too many).
    const lanesThen = kinds.filter((k) => k === "pruh").length + 1;
    if (kerb && ruled && lanesThen <= had && p.w > LANE_MAX && p.w - usual >= 0.5 && p.w - usual <= OUTER_MAX) {
      const lane = { s: q === 0 ? p.e - usual : p.s, e: q === 0 ? p.e : p.s + usual, w: usual };
      const shoulder = { s: q === 0 ? p.s : p.s + usual, e: q === 0 ? p.e - usual : p.e, w: p.w - usual, rules: true };
      pieces.splice(q, 1, ...(q === 0 ? [shoulder, lane] : [lane, shoulder]));
      kinds.splice(q, 1, ...(q === 0 ? ["krajnice", "pruh"] : ["pruh", "krajnice"]));
    }
  }
  if (kinds.includes(null) || pieces.length < 2) return fail(`kus není pruh ani krajnice: ${pieces.map((p, q) => `${p.w.toFixed(2)}${kinds[q] === null ? "!" : ""}`).join(" ")} (pravidla ${had} pruhy)`);
  // On ČÚZK's 12.5 cm a line near one kerb only is as often the kerb itself (the map's carriageway a metre off) or
  // worn asphalt as an edge line: a shoulder only where both kerbs have one (Hradec; Bára).
  // The lane it joins must still look like one (else the rules stay: 324, worn asphalt taken for the centre line).
  let strict = -1;
  const lineShoulder = (q) => kinds[q] === "krajnice" && !pieces[q].rules; // not one estimated behind a missed line
  if (!fine && lineShoulder(0) !== lineShoulder(kinds.length - 1) && kinds.filter((k) => k === "krajnice").length < 2) {
    const q = lineShoulder(0) ? 0 : kinds.length - 1;
    if (pieces.length > 2) { kinds[q] = "join"; strict = q; }
  }
  if (kinds[0] === "join") { pieces[1].s = pieces[0].s; pieces[1].w = pieces[1].e - pieces[1].s; pieces[1].wide = strict !== 0; }
  if (kinds.at(-1) === "join") { const o = pieces.at(-2); o.e = pieces.at(-1).e; o.w = o.e - o.s; o.wide = strict !== kinds.length - 1; }
  const list = pieces.map((p, q) => ({ ...p, kind: kinds[q] })).filter((p) => p.kind !== "join");
  // Everything joined (two pieces, both joined to each other: Banská Bystrica, the A/B test of 16. 11. 2026): nothing to measure.
  if (!list.length) return fail("vše spojené");
  if (list.some((p) => p.kind === "pruh" && p.w > (p.wide ? LANE_MAX + LANE_MIN : LANE_MAX))) return fail("pruh moc široký");
  // A piece at a kerb where the rules had a shoulder, behind a solid line, is the shoulder behind an edge line
  // (Rozvadovská spojka: 3 m behind the line; Brněnská; Brno, Hradecká: 3.6 m), behind a dashed line a lane
  // (Poděbradská); when that is not known, a shoulder up to SHOULDER_MAX if it would be one lane more than the rules had.
  for (const side of ["s", "e"]) {
    const ruled = (side === "s" ? w.parts[0] : w.parts.at(-1)).seg.type === "krajnice", end = side === "s" ? list[0] : list.at(-1);
    const line = side === "s" ? lines.indexOf(end.e) : lines.indexOf(end.s);
    const more = list.filter((p) => p.kind === "pruh").length > had;
    if (ruled && end.kind === "pruh" && ((solid[line] === true && end.w <= LANE_MAX) || (solid[line] === undefined && more && end.w <= SHOULDER_MAX))) end.kind = "krajnice";
  }
  // The profile's roadway against the map's: the difference to the shoulder the rules had on that side (or a new
  // one, from 1 m), else to the outer lanes evenly.
  let delta = (w.e - w.s) - (c.e - c.s);
  const ruleSide = (side) => (side === "s" ? w.parts[0] : w.parts.at(-1)).seg.type === "krajnice";
  const sides = ["s", "e"].filter(ruleSide);
  if (Math.abs(delta) > 0.05) {
    const share = delta / (sides.length || 2);
    for (const side of sides.length ? sides : ["s", "e"]) {
      const end = side === "s" ? list[0] : list.at(-1);
      if (end.kind === "krajnice" || !sides.length || share < 1) end.w += share;
      else if (side === "s") list.unshift({ w: share, kind: "krajnice", rules: true }); else list.push({ w: share, kind: "krajnice", rules: true });
    }
    if (list.some((p) => p.w < EDGE_MIN)) return fail("rozdíl šířky nevyjde");
  }
  // After that every lane must still look like one, or the rules' profile stays.
  if (list.some((p) => p.kind === "pruh" && (p.w < LANE_MIN - 0.2 || p.w > (p.wide ? LANE_MAX + LANE_MIN : LANE_MAX + 0.25)))) return fail("závěrečná kontrola šířek");
  const oldLanes = w.parts.filter((p) => p.seg.type === "pruh"), lanes = list.filter((p) => p.kind === "pruh");
  let li = 0;
  const segs = list.map((p) => {
    if (p.kind === "krajnice" || p.kind === "stred") return { type: "krajnice", width: +p.w.toFixed(2), source: p.rules ? "odhad" : "ortofoto" };
    const from = oldLanes.length === lanes.length ? oldLanes[li] : oldLanes[Math.min(oldLanes.length - 1, Math.floor((li * oldLanes.length) / lanes.length))];
    li++;
    const seg = { ...(from?.seg || { type: "pruh" }), type: "pruh", width: +p.w.toFixed(2), source: "ortofoto" };
    if (oldLanes.length !== lanes.length) delete seg.turn;
    return seg;
  });
  // Across a paved median the lanes run the way the rules' outer lanes on that side run (the rules may have made
  // the median a lane of its own direction).
  const mid = list.findIndex((p) => p.kind === "stred");
  if (mid >= 0 && oldLanes.length) list.forEach((p, q) => { if (p.kind === "pruh" && segs[q].dir) segs[q].dir = (q < mid ? oldLanes[0] : oldLanes.at(-1)).seg.dir; });
  // The roadway keeps its width to the centimetre (rounding goes to the last part).
  const last = segs.at(-1);
  last.width = +(last.width + (w.e - w.s) - segs.reduce((x, q) => x + q.width, 0)).toFixed(2);
  return segs;
}

// One roadway redrawn by the lines (profile positions), or null when the lines do not fit.
function redraw(w, lines, fine = true) {
  const used = new Set();
  // Boundaries: between two parts of the roadway. One between a lane or shoulder and anything else (parking, bike
  // lane, bus lane…) only moves to a line within SNAP; the lanes and shoulders between them are split by the rest.
  const bounds = w.parts.slice(1).map((p, q) => ({ t: p.s, block: BLOCK.has(p.seg.type) && BLOCK.has(w.parts[q].seg.type) }));
  for (const b of bounds) {
    if (b.block) continue;
    const near = lines.filter((l) => !used.has(l)).reduce((x, l) => (Math.abs(l - b.t) < Math.abs(x - b.t) ? l : x), Infinity);
    if (Math.abs(near - b.t) <= SNAP) { b.t = near; used.add(near); }
  }
  // The blocks of lanes and shoulders, between the kept boundaries.
  const edges = [w.s, ...bounds.filter((b) => !b.block).map((b) => b.t), w.e];
  const groups = [];
  let gi = 0;
  for (let q = 0; q < w.parts.length; q++) {
    if (q > 0 && !bounds[q - 1].block) gi++;
    (groups[gi] ??= []).push(w.parts[q]);
  }
  const segs = [];
  let changed = false;
  for (const [g, list] of groups.entries()) {
    const s = edges[g], e = edges[g + 1];
    const keep = () => list.forEach((p, q) => segs.push({ ...p.seg, width: +((q === list.length - 1 ? e : p.e) - (q === 0 ? s : p.s)).toFixed(2) }));
    if (!list.every((p) => BLOCK.has(p.seg.type))) { keep(); if (Math.abs(s - list[0].s) > 0.01 || Math.abs(e - list.at(-1).e) > 0.01) changed = true; continue; }
    const inside = lines.filter((l) => !used.has(l) && l > s + 0.3 && l < e - 0.3);
    if (!inside.length) { lastWhy ||= "jiné části, čáry jen na hranách"; keep(); continue; }
    const cuts = [s, ...inside, e], pieces = cuts.slice(1).map((x, q) => ({ s: cuts[q], e: x, w: x - cuts[q] }));
    // At a kerb (the roadway's own edge) a piece up to 2.5 m is a shoulder (a sliver under EDGE_MIN joins its neighbour);
    // anything else must be a lane (2.5–4.75 m), or the block stays as the rules drew it.
    const atKerb = (p) => Math.abs(p.s - w.s) < 0.01 || Math.abs(p.e - w.e) < 0.01;
    const kinds = pieces.map((p) => (atKerb(p) && p.w < EDGE_MIN ? "join" : atKerb(p) && p.w < LANE_MIN ? "krajnice" : p.w >= LANE_MIN && p.w <= LANE_MAX ? "pruh" : null));
    if (kinds.includes(null) || pieces.length < 2) { lastWhy ||= "jiné části, kus není pruh"; keep(); continue; }
    // ČÚZK: a shoulder only where both kerbs of the roadway have one (as in measured()).
    if (!fine && pieces.length > 2) {
      const ends = [0, kinds.length - 1].filter((q) => kinds[q] === "krajnice" && atKerb(pieces[q]));
      const kerbs = [0, kinds.length - 1].filter((q) => atKerb(pieces[q]));
      if (ends.length === 1 && kerbs.length === 2) kinds[ends[0]] = "join";
    }
    // A sliver at a kerb (only the first or the last piece can be one) widens its neighbour.
    if (kinds[0] === "join") { pieces[1].s = pieces[0].s; pieces[1].w = pieces[1].e - pieces[1].s; }
    if (kinds.at(-1) === "join") { const o = pieces.at(-2); o.e = pieces.at(-1).e; o.w = o.e - o.s; }
    const keepPieces = pieces.filter((_, q) => kinds[q] !== "join"), keepKinds = kinds.filter((x) => x !== "join");
    if (keepPieces.some((p, q) => keepKinds[q] === "pruh" && p.w > LANE_MAX)) { lastWhy ||= "jiné části, pruh moc široký"; keep(); continue; }
    // The lanes take what the rules' lanes had: in order when there are as many, else from the lane they overlap most.
    const oldLanes = list.filter((p) => p.seg.type === "pruh"), newLanes = keepKinds.filter((x) => x === "pruh").length;
    let li = 0;
    keepPieces.forEach((p, q) => {
      if (keepKinds[q] === "krajnice") { segs.push({ type: "krajnice", width: +p.w.toFixed(2), source: "ortofoto" }); return; }
      const from = oldLanes.length === newLanes ? oldLanes[li] : oldLanes.reduce((b, o) => (Math.min(o.e, p.e) - Math.max(o.s, p.s) > Math.min(b.e, p.e) - Math.max(b.s, p.s) ? o : b), oldLanes[0] || list[0]);
      li++;
      const seg = { ...(from?.seg || { type: "pruh" }), type: "pruh", width: +p.w.toFixed(2), source: "ortofoto" };
      if (oldLanes.length !== newLanes) delete seg.turn; // the arrows belonged to the lanes as the rules drew them
      segs.push(seg);
    });
    changed = true;
  }
  return changed ? segs : null;
}

// ---------- a north-up square of the orthophoto (ai-kerbs.js) ----------
// The square of side 2 × half m on the ground around lon, lat, px × px pixels, north up, in Web Mercator as the AI
// model learnt it (evaluation/ai-segmentation/fetch_ortho.py): the source's shift applied as above. Returns
// { source, img } (ImageData) or null (no photo there); a server down throws as laneImage does.
export async function orthoPatch({ source, lon, lat, half, px, timeout = TIMEOUT }) {
  const keys = source === "de" ? (await landsAt(lon, lat).catch(() => [])).map((l) => `de-${l}`) : source === "be" ? [...new Set([...(await beRegionsAt(lon, lat).catch(() => [])).map(beOrthoOf), "vl", "wal"])].map((r) => `be-${r}`) : source === "pt" ? ptKeys(lon, lat) : source === "es" ? esKeys(lon, lat) : source === "it" ? itOrthoAt(lon, lat) : source === "fi" ? fiOrthoAt(lon, lat) : [SOURCES[source] ? source : "cuzk"];
  const seen = new Set(); // Berlin and Brandenburg: one service
  for (const key of keys) {
    const id = key.startsWith("de-") ? DE_ORTHO[key.slice(3)].wms : key;
    if (seen.has(id)) continue;
    seen.add(id);
    const img = await patchOf(key, lon, lat, half, px, timeout);
    if (img) return { source: key, img };
  }
  return null;
}
async function patchOf(key, lon, lat, half, px, timeout) {
  const src = SOURCES[key], k = Math.cos((lat * Math.PI) / 180), h = half / k;
  const [sx, sy] = (src.shift || [0, 0]).map((v) => v / k), [cx, cy] = merc(lon, lat);
  const b = [cx - h + sx, cy - h + sy, cx + h + sx, cy + h + sy];
  const canvas = new OffscreenCanvas(px, px), g = canvas.getContext("2d");
  const signal = AbortSignal.timeout(timeout);
  if (src.tiles) {
    const size = (2 * Math.PI * R) / 2 ** src.z, scale = px / (b[2] - b[0]);
    const tx0 = Math.floor((b[0] + Math.PI * R) / size), tx1 = Math.floor((b[2] + Math.PI * R) / size);
    const ty0 = Math.floor((Math.PI * R - b[3]) / size), ty1 = Math.floor((Math.PI * R - b[1]) / size);
    if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 40) return null;
    let down = 0, missing = 0;
    const jobs = [];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const gx = tx * size - Math.PI * R, gy = Math.PI * R - ty * size;
      jobs.push(fetch(`${src.tiles}/${src.z}/${src.xy ? `${tx}/${src.tms ? 2 ** src.z - 1 - ty : ty}` : `${ty}/${tx}`}${src.ext || ""}`, { signal }).then(async (r) => {
        if (r.ok) g.drawImage(await createImageBitmap(await r.blob()), (gx - b[0]) * scale, (b[3] - gy) * scale, size * scale, size * scale);
        else if (r.status >= 500) down++; else missing++;
      }));
    }
    await Promise.all(jobs);
    if (jobs.length && down === jobs.length) throw Object.assign(new Error(`ortofoto ${down}× 5xx`), { outage: true });
    if (missing && src.fallback) return patchOf(src.fallback, lon, lat, half, px, timeout);
  } else {
    const r = await fetch(src.url(b, px, px), { signal });
    if (!r.ok) { if (r.status >= 500) throw Object.assign(new Error(`ortofoto ${r.status}`), { outage: true }); return null; }
    g.drawImage(await createImageBitmap(await r.blob()), 0, 0, px, px);
  }
  const img = g.getImageData(0, 0, px, px);
  return blank(img) ? null : img;
}
