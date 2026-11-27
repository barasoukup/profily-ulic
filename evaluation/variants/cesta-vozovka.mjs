// Prague since 15. 11. 2026 (derive.js roadOnPath; this variant forces it on for any city): a "sidewalk or park path" of MTVU (702) at least 5 m wide that an OSM road crosses is its
// roadway, as an estimate, where MTVU has no roadway along the whole cut (Prague, Poncarova; Bára asked first
// which cuts it would touch).
//   CITY=praha VARIANTS=city,cesta-vozovka node evaluation/ab.mjs
export const about = "plocha 702 pod silnicí z OSM jako vozovka (zkouška)";
const { deriveProfile: d } = await import("../../app/public/derive.js");
export const deriveProfile = (o) => d({ ...o, roadOnPath: true });
