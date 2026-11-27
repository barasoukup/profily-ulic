// Rules of 11/2026 (evaluation/pravidla-11-2026/ZPRAVA.md): the derivation before the change, from a copy of
// app/public made before it (cp -R app/public/*.js app/public/towns evaluation/pravidla-11-2026/data/kod-2).
// Sources are the city's normal ones, so only the rules differ.   VARIANTS=pred-tsk,city node evaluation/ab.mjs
export const about = "pruhy bez třídy TSK (před změnou 3)";
export const { deriveProfile } = await import("../pravidla-11-2026/data/kod-2/derive.js");
