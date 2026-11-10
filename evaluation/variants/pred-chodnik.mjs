// Rules of 11/2026 (evaluation/pravidla-11-2026/ZPRAVA.md, part 5): the derivation before "parking on the sidewalk
// from OSM (on_kerb, half_on_kerb)", from a copy of pilot/public made before it (data/kod-5).
//   SAMPLES=evaluation/pravidla-11-2026/data/samples-chodnik-praha.json CITY=praha VARIANTS=pred-chodnik,po-chodnik ITEMS=1 PARTS=1 node evaluation/ab.mjs
export const about = "stání na chodníku z OSM před změnou 5";
export const { deriveProfile } = await import("../pravidla-11-2026/data/kod-5/derive.js");
