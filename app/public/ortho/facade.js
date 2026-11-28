import { P } from "./settings.js";

// The outermost piece of a side (out[before…], pushed from the street out) when it is paving no wider than FACADE_STRIP,
// reaches the end `to` and has a sidewalk on its street side (the map's at(t) or the side's piece before it): it becomes
// sidewalk (deriveProfile then joins it to its neighbour).
const FACADE_STRIP = 1.5;
export function facadeStrip(out, before, to, sg, at) {
  const k = out.length - 1, p = out[k];
  if (p.code !== 1003 || !p.span) return;
  const [inner, outer] = sg < 0 ? [p.span[1], p.span[0]] : p.span;
  if (Math.abs(outer - to) > 0.15 || Math.abs(outer - inner) > FACADE_STRIP + 0.01) return;
  const prev = k > before ? out[k - 1] : null;
  const walk = [702, 703].includes(at(inner - sg * 0.15)) || (prev?.code === 702 && prev.span && Math.abs(prev.span[sg < 0 ? 0 : 1] - inner) < 0.15);
  if (!walk) return;
  out[k] = { ...p, code: 702, label: "chodník u fasády (odhad)" };
  if (P.dbg) P.dbg.facade = (P.dbg.facade || 0) + 1;
}
// The profile cut to the ends orthoOsmPolys found (polys.ends; t from the cut's centre, A below it, B above): parts
// beyond them dropped, the part across an end shortened; that end then "volno". result: deriveProfile's.
export function trimToEnds(result, ends) {
  if (!ends || !result?.extent || !result.segments?.length) return result;
  let lo = ends.A ?? -Infinity, hi = ends.B ?? Infinity;
  // A soft end (nothing of OSM there) goes out to the outer edge of the last part that is the street's own (not green,
  // unknown, paving or water beyond it).
  const OPEN = new Set(["zelen", "nezname", "plocha", "voda", "predzahradka"]);
  if (ends.soft) {
    let t = result.extent[1];
    for (const s of result.segments) {
      const e = t, b = t - s.width;
      t = b;
      if (OPEN.has(s.type)) continue;
      if (ends.soft.A && b < lo) lo = b;
      if (ends.soft.B && e > hi) hi = e;
    }
  }
  // Never past the edge of a bridge's deck (orthoOsmPolys ends.cap).
  if (ends.cap?.A !== undefined) lo = Math.max(lo, ends.cap.A);
  if (ends.cap?.B !== undefined) hi = Math.min(hi, ends.cap.B);
  if (lo <= result.extent[0] + 0.05 && hi >= result.extent[1] - 0.05) return result;
  // segments run from extent[1] (B, the profile's left) down to extent[0].
  let t = result.extent[1];
  const kept = [];
  for (const s of result.segments) {
    const e = t, b = t - s.width;
    t = b;
    const ee = Math.min(e, hi), bb = Math.max(b, lo);
    if (ee - bb < 0.05) continue;
    kept.push(ee - bb < s.width - 0.01 ? { ...s, width: +(ee - bb).toFixed(2) } : s);
  }
  const ext = [Math.max(result.extent[0], lo), Math.min(result.extent[1], hi)];
  const edges = { ...(result.edges || {}) };
  if (hi < result.extent[1] - 0.05) edges.left = "volno";
  if (lo > result.extent[0] + 0.05) edges.right = "volno";
  return { ...result, segments: kept, extent: ext, edges };
}
