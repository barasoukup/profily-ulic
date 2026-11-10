// Rules of 11/2026 (evaluation/pravidla-11-2026/ZPRAVA.md, part 5): the current derivation, parking on the
// sidewalk from OSM carved out of the sidewalk (on_kerb) or across the kerb (half_on_kerb).
//   VARIANTS=pred-chodnik,po-chodnik (see pred-chodnik.mjs)
export const about = "stání na chodníku z OSM (po změně 5)";
export const { deriveProfile } = await import("../../pilot/public/derive.js");
