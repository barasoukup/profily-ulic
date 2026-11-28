// The Netherlands (Bára 20. 11. 2026): PDOK's Luchtfoto, the yearly national orthophoto of Beeldmateriaal Nederland (Actueel_orthoHR,
// 8 cm, open data), WMTS tiles in Web Mercator to level 21, {z}/{x}/{y}, CORS for any origin. Beyond the border PDOK answers with
// a blank tile (the map's layer is kept inside).
export const sources = [
  { id: "nl", res: 0.1, credit: "common.orthophotoBeeldmateriaalNlPdok",
    service: { type: "xyz", base: "https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857", z: 20, px: 256, ext: ".jpeg", xy: true },
    map: { kind: "tiles", state: "netherlands", limit: "inside", bounds: "extent", maxNativeZoom: 21 } },
];
