// The surface of a tram bed (evaluation/pravidla-11-2026/ZPRAVA.md, section 4), (a): as before 11/2026, panels
// wherever OSM says nothing (and OSM's asphalt as panels too); the rest of the derivation is today's.
//   CITY=praha VARIANTS=tram-panely,tram-pravidlo,tram-orto PARTS=1 CACHE=disk node evaluation/ab.mjs
import { deriveProfile as derive } from "../../pilot/public/derive.js";
export const about = "těleso z panelů, kde OSM nic neříká (dřívější stav)";
export function deriveProfile(args) {
  const r = derive({ ...args, ortho: null });
  for (const s of r.segments || []) if (s.type === "tramvaj" && (s.bedGuess || s.bed === "asfalt")) s.bed = "panely";
  return r;
}
