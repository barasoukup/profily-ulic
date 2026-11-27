// Rules of 11/2026 (evaluation/archive/rules-2026-11/REPORT.md): the derivation before the change, from a copy of
// app/public made before it (cp -R app/public/*.js app/public/towns evaluation/archive/rules-2026-11/data/kod-1).
// Sources are the city's normal ones, so only the rules differ.   VARIANTS=pred-tram,city node evaluation/ab.mjs
export const about = "tramvaj ve dvou druzích (před změnou 2)";
export const { deriveProfile } = await import("../archive/rules-2026-11/data/kod-1/derive.js");
