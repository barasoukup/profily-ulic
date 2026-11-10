// Rules of 11/2026 (evaluation/pravidla-11-2026/ZPRAVA.md, part 4): the derivation before the change "no parking
// estimate at a kerb without a sidewalk outside the built-up area, none in a residential zone", from a copy of
// pilot/public made before it (data/kod-3).   VARIANTS=pred-zastavba,po-zastavba ITEMS=1 node evaluation/ab.mjs
export const about = "odhad stání i mimo zástavbu bez chodníku a v obytné zóně (před změnou 4)";
export const { deriveProfile } = await import("../pravidla-11-2026/data/kod-3/derive.js");
