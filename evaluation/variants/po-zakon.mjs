// Rules of 11/2026 (evaluation/archive/rules-2026-11/REPORT.md): the derivation right after the parking estimate by
// the law, before the kinds of tram (copy kod-1), so change 1 is tested alone:
//   VARIANTS=pred-zakon,po-zakon ITEMS=1 node evaluation/ab.mjs
export const about = "odhad stání podle zákona (po změně 1)";
export const { deriveProfile } = await import("../archive/rules-2026-11/data/kod-1/derive.js");
