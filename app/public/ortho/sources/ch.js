// Switzerland and Liechtenstein (Bára 17. 11. 2026): swisstopo's SWISSIMAGE 10 cm (open data of the Confederation, "© swisstopo"),
// WMTS tiles in Web Mercator to level 20 (21 refused), CORS for any origin; it covers Liechtenstein and a strip beyond the border
// (the map's layer is kept to both states: beyond the border swisstopo answers with a coarse satellite image, the hostile review).
// Its tiles are {z}/{x}/{y} (xy), not ArcGIS's {z}/{y}/{x}.
export const sources = [
  { id: "ch", res: 0.1, credit: "common.orthophotoSwissimageSwisstopo",
    service: { type: "xyz", base: "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857", z: 20, px: 256, ext: ".jpeg", xy: true },
    map: { kind: "tiles", states: ["switzerland", "liechtenstein"], limit: "inside", bounds: "extent", maxNativeZoom: 20 } },
];
