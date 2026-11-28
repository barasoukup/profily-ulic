// Slovakia (Bára 15. 11. 2026): the ZBGIS orthophoto mosaic of ÚGKK SR (GKÚ, NLC), its cache in Web Mercator to level 19 (about
// 10 cm on the ground; Bratislava 2023, Košice 2025), CORS for any origin, tiles cached a day. The grid of z19, tiles of 512 px.
// balance: the mosaic is bright and tinted (Košice 2025: asphalt 200 bright and 10 greener than red and blue, read as grass), so
// the tints are taken relative to its grey pixels.
export const sources = [
  { id: "sk", res: 0.1, balance: true, credit: "credits.orthophotoGkuBratislavaNlc",
    service: { type: "xyz", base: "https://zbgis.skgeodesy.sk/zbgis/rest/services/Ortofoto_hres/MapServer/tile", z: 19, px: 512 },
    map: { kind: "tiles", state: "slovensko", limit: "kept", maxNativeZoom: 19, attribution: "ortofoto © GKÚ Bratislava, NLC (ZBGIS)" } },
];
