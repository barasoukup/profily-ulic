// Luxembourg (Bára 20. 11. 2026): the latest orthophoto of the ACT (geoportail.lu, WMTS {z}/{x}/{y} in Web Mercator to level 21,
// CORS *). On the map it comes first, Belgium's regions over it (each answers transparent or nothing outside itself; the hostile
// review: a white tile of one hid its neighbour).
export const sources = [
  { id: "lu", res: 0.1, credit: "common.orthophotoActLuxembourgGeoportail",
    service: { type: "xyz", base: "https://wmts1.geoportail.lu/opendata/wmts/ortho_latest/GLOBAL_WEBMERCATOR_4_V3", z: 20, px: 256, ext: ".jpeg", xy: true },
    map: { kind: "tiles", state: "luxembourg", limit: "inside", maxNativeZoom: 21 } },
];
