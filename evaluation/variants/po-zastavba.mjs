// Rules of 11/2026 (evaluation/pravidla-11-2026/ZPRAVA.md, part 4): the same copy as pred-zastavba with only
// derive.js after the change (data/kod-4), so the change is tested alone.
//   VARIANTS=pred-zastavba,po-zastavba ITEMS=1 node evaluation/ab.mjs
export const about = "bez odhadu stání mimo zástavbu bez chodníku a v obytné zóně (po změně 4)";
export const { deriveProfile } = await import("../pravidla-11-2026/data/kod-4/derive.js");
