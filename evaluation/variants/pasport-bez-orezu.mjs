// The app without the trim of the roadways the DTM only guesses around a passport's roadway (towns/overlay.js
// trimGuessedRoads, ?orez=0), against "city" (with it). Bára 26. 11. 2026, evaluation/pasporty-orez.
//   CITY=roznov VARIANTS=pasport-bez-orezu,city CACHE=disk node evaluation/ab.mjs
import * as S from "../../pilot/public/sources.js";
export const about = "bez ořezu odhadnutých vozovek kolem pasportu";
export async function surfaces(bbox) {
  const before = globalThis.PROFILY_OPTS;
  globalThis.PROFILY_OPTS = { ...before, orez: "0" };
  try { return await S.mtvu(bbox); } finally { globalThis.PROFILY_OPTS = before; }
}
