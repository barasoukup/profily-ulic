// The surface of a tram bed (evaluation/pravidla-11-2026/ZPRAVA.md, section 4), (c): the rule and the orthophoto
// of ČÚZK (ortho.js), one small image per cut with tram tracks, through ab.mjs's fetch (polite.mjs, CACHE=disk).
// What the pixels said is kept in the result (orthoSeen) for the tuning of ortho.js.
import { bedOrtho } from "../../pilot/public/ortho.js";
export const about = "pravidlo + ortofoto";
export async function ortho(ctx, res) {
  const o = await bedOrtho({ ...ctx, timeout: 30000, ...(res ? { res } : {}) });
  if (!o) return null;
  const seen = [];
  return { ms: o.ms, seen, look: (s, e, rails, at, dir) => { const r = o.look(s, e, rails, at, dir); seen.push({ s: +s.toFixed(2), e: +e.toFixed(2), ...(r && Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "number" ? +v.toFixed(3) : v]))) }); return r; } };
}
