// Rules of 11/2026 (evaluation/pravidla-11-2026/ZPRAVA.md): the derivation before the change, from a copy of
// pilot/public made before it (cp -R pilot/public/*.js pilot/public/towns evaluation/pravidla-11-2026/data/kod-0).
// Sources are the city's normal ones, so only the rules differ.   VARIANTS=pred-zakon,city node evaluation/ab.mjs
export const about = "odhad stání bez zákona (před změnou 1)";
export const { deriveProfile } = await import("../pravidla-11-2026/data/kod-0/derive.js");
