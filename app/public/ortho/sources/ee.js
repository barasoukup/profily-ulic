// Estonia (Bára 23. 11. 2026): the Land and Spatial Development Board's orthophoto as TMS tiles in Web Mercator (the y axis flipped;
// CORS *; its open-data licence of 1. 1. 2025), clean but only to level 18 (about 30 cm at 59° N). The WMS of full resolution (to
// 3 cm in Tallinn) carries a watermark on a 400 px grid that would read as lines (evaluation/estonia/SOURCES.md).
export const sources = [
  { id: "ee", res: 0.3, blank: true, credit: "common.orthophotoMaaJaRuumiamet",
    service: { type: "xyz", base: "https://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC", z: 18, px: 256, ext: ".jpg", xy: true, tms: true },
    map: { kind: "tiles", state: "estonia", limit: "inside", tms: true, maxNativeZoom: 18 } },
];
