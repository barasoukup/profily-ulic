// Rules of 11/2026 (evaluation/archive/rules-2026-11/REPORT.md, part 4): the same copy as pred-zastavba with only
// derive.js after the change (data/kod-4), so the change is tested alone.
//   VARIANTS=pred-zastavba,po-zastavba ITEMS=1 node evaluation/ab.mjs
export const about = "bez odhadu stání mimo zástavbu bez chodníku a v obytné zóně (po změně 4)";
export const { deriveProfile } = await import("../archive/rules-2026-11/data/kod-4/derive.js");
