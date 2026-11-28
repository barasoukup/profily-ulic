// Austria (Bára 16. 11. 2026): basemap.at's orthophoto (Verwaltungsgrundkarte, CC BY 4.0), Web Mercator tiles to level 20 (about
// 10 cm a pixel, the photo 15–30 cm), CORS for any origin. Level 20 only in some towns (Vienna, Graz, Linz; Salzburg, Innsbruck,
// Klagenfurt, St. Pölten: 404, found by the universal judging 17. 11. 2026): level 19 where a tile of 20 is missing (`fallback`),
// and the map's layer is level 19 everywhere (zoomed in beyond it).
const BASE = "https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857";
export const sources = [
  { id: "at", res: 0.1, fallback: "at19", credit: "credits.orthophotoBasemapCc4", service: { type: "xyz", base: BASE, z: 20, px: 256, ext: ".jpeg" },
    map: { kind: "tiles", state: "austria", limit: "kept", maxNativeZoom: 19, attribution: "ortofoto © basemap.at" } },
  { id: "at19", res: 0.1, credit: "credits.orthophotoBasemapCc4", service: { type: "xyz", base: BASE, z: 19, px: 256, ext: ".jpeg" }, map: null },
];
