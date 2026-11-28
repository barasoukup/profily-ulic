// The orthophotos of Germany's Länder: WMS 1.3.0 GetMap in EPSG:3857 (each answered with CORS and a photo, 17. 11. 2026), with the
// credit each asks for (its capabilities' Fees and AccessConstraints; `creditWho`). The Land of the cut's centre first, near a
// border the next Land's when the first has no photo there, all within one timeout (the review of Germany); Berlin and Brandenburg
// are one service of the LGB. The map has one layer for all of them: a tile from the WMS of the Land its centre lies in (laender.json,
// loaded when the first tile in Germany is drawn), near a border the Länder's images stacked as transparent PNGs.
const land = (land, base, layers, creditWho, time) => ({ id: `de-${land}`, chain: "de", land, res: 0.1, blank: true, creditWho, map: null,
  service: { type: "wms", keys: "lower", base, layers, ...(time && { time }) } });
export const chain = { id: "de", pick: "lands", share: true, mapCredit: "app.orthophotoGermanLanderGeobasis",
  map: { kind: "lands", state: "germany", limit: "own", minZoom: 12 } };
export const sources = [
  land("BW", "https://owsproxy.lgl-bw.de/owsproxy/ows/WMS_LGL-BW_ATKIS_DOP_20_C", "IMAGES_DOP_20_RGB", "© LGL-BW (dl-de/by-2-0)"),
  land("BY", "https://geoservices.bayern.de/od/wms/dop/v1/dop20", "by_dop20c", "© Bayerische Vermessungsverwaltung (CC BY 4.0)"),
  // Berlin and Brandenburg in one layer of the LGB.
  land("BE", "https://isk.geobasis-bb.de/mapproxy/dop20c/service/wms", "bebb_dop20c", "© GeoBasis-DE/LGB (dl-de/by-2-0)"),
  land("BB", "https://isk.geobasis-bb.de/mapproxy/dop20c/service/wms", "bebb_dop20c", "© GeoBasis-DE/LGB (dl-de/by-2-0)"),
  land("HB", "https://geodienste.bremen.de/wms_dop20_2023", "DOP20_2023_HB,DOP20_2023_BHV", "© Landesamt GeoInformation Bremen (CC BY 4.0)"),
  // The time series of Hamburg: 2024 asked by name (its 2022 is a satellite image under a closed licence).
  land("HH", "https://geodienste.hamburg.de/wms_dop_zeitreihe_belaubt", "dop_zeitreihe_belaubt", "© Freie und Hansestadt Hamburg, LGV (dl-de/by-2-0)", "2024"),
  land("HE", "https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-images.ows", "he_dop20_rgb", "© HVBG (dl-de/zero-2-0)"),
  land("MV", "https://www.geodaten-mv.de/dienste/adv_dop", "mv_dop", "© GeoBasis-DE/M-V (CC BY 4.0)"),
  land("NI", "https://opendata.lgln.niedersachsen.de/doorman/noauth/dop_wms", "ni_dop20", "© LGLN (CC BY 4.0)"),
  land("NW", "https://www.wms.nrw.de/geobasis/wms_nw_dop", "nw_dop_rgb", "© GeoBasis-DE/NRW (dl-de/zero-2-0)"),
  land("RP", "https://geo4.service24.rlp.de/wms/rp_dop20.fcgi", "rp_dop20", "© GeoBasis-DE/LVermGeoRP (dl-de/by-2-0)"),
  land("SH", "https://dienste.gdi-sh.de/WMS_SH_DOP20col_OpenGBD", "sh_dop20_rgb", "© GeoBasis-DE/LVermGeo SH (CC BY 4.0)"),
  land("SL", "https://geoportal.saarland.de/freewms/dop2023", "sl_dop20_rgb", "© GeoBasis DE/LVGL-SL (dl-de/by-2-0)"),
  land("SN", "https://geodienste.sachsen.de/wms_geosn_dop-rgb/guest", "sn_dop_020", "© GeoSN (dl-de/by-2-0)"),
  land("ST", "https://www.geodatenportal.sachsen-anhalt.de/wss/service/INSPIRE_LVermGeo_ATKIS_OI/guest", "OI_OrthoimageCoverage", "© GeoBasis-DE / LVermGeo ST (dl-de/by-2-0)"),
  land("TH", "https://www.geoproxy.geoportal-th.de/geoproxy/services/DOP", "th_dop", "© GDI-Th (CC BY 4.0)"),
];
