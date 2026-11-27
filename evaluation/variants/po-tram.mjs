// Rules of 11/2026 (evaluation/archive/rules-2026-11/REPORT.md): the derivation right after the three kinds of tram,
// before the lane widths by TSK's class (copy kod-2), so change 2 is tested alone:
//   VARIANTS=pred-tram,po-tram PARTS=1 node evaluation/ab.mjs
export const about = "tramvaj ve třech druzích (po změně 2, před změnou 3)";
export const { deriveProfile } = await import("../archive/rules-2026-11/data/kod-2/derive.js");
