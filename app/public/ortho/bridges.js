import { crossT, levelOf, onBridge } from "./osm-along.js";
import { P } from "./settings.js";

// ---------- the deck of a bridge ----------
// Where the cut runs over a bridge deck OSM maps as its outline (man_made=bridge; tools/build_osm_tiles.mjs keeps the
// decks since 26. 11. 2026, cut by tiles: the pieces of one deck join again here): the stretches [s, e] of the cut's
// line on a deck (t as derive.js, from the cut's centre). Only for a street on a bridge (onBridge), only decks of its
// level (a deck without a layer counts), and only when a deck holds the street's axis (else OSM's deck and its street
// do not agree and nothing is decided by it). Returns { spans, axis } or null. ?off=mostdeska: none (as before).
const DECK_GAP = 0.1; // m: pieces of one deck (cut by tiles) closer than this join
export function deckSpans(elements, frame, dir, way) {
  if (P.off?.has("mostdeska") || !onBridge(way?.tags)) return null;
  const normal = [-dir[1], dir[0]];
  const tu = (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
  const level = levelOf(way.tags);
  let axis = null;
  const raw = [];
  for (const el of elements || []) {
    if (el.type === "way" && el.id === way.id) {
      for (const x of crossT(el.geometry.map((p) => tu(p.lon, p.lat)), 60)) if (axis === null || Math.abs(x.t) < Math.abs(axis)) axis = x.t;
      continue;
    }
    if (el.type !== "area" || el.tags?.man_made !== "bridge") continue;
    if (el.tags.layer !== undefined && Number(el.tags.layer) !== level) continue;
    const rings = [el.geometry, ...(el.holes || [])].map((r) => { const g = r.map((p) => tu(p.lon, p.lat)); return [...g, g[0]]; });
    const ts = rings.flatMap((r) => crossT(r, 60).map((x) => x.t)).sort((a, b) => a - b);
    for (let i = 0; i + 1 < ts.length; i += 2) if (ts[i + 1] - ts[i] > 0.05) raw.push({ s: ts[i], e: ts[i + 1] });
  }
  if (axis === null || !raw.length) return null;
  raw.sort((a, b) => a.s - b.s);
  const spans = [];
  for (const r of raw) { const l = spans.at(-1); if (l && r.s <= l.e + DECK_GAP) l.e = Math.max(l.e, r.e); else spans.push({ ...r }); }
  if (!spans.some((x) => x.s <= axis && axis <= x.e)) return null;
  return { spans, axis };
}
// The deck stretch holding t (within tol), or null.
export const deckAt = (decks, t, tol = 0) => decks?.spans.find((x) => x.s - tol <= t && t <= x.e + tol) || null;
// A stretch [a, b] of the cut less the decks: the pieces of it off them (the ground beside or between the decks). The
// water beside the outer deck ends the street at the deck's edge too (derive.js): keeping only the gap between two decks
// lost 6 of the blind A/B's wins for 2 of its losses (evaluation/archive/bridge-water/edge/REPORT.md).
export const offDecks = (a, b, decks) => {
  let out = [[a, b]];
  for (const d of decks?.spans || []) out = out.flatMap(([x, y]) => (d.e <= x || d.s >= y ? [[x, y]] : [...(d.s > x ? [[x, d.s]] : []), ...(d.e < y ? [[d.e, y]] : [])]));
  return out;
};
// A railing at the outer edge of a street on a bridge (Bára 26. 11. 2026: "ideálně dokreslila do profilu zábradlí"):
// an item "zabradli" at the outer side of the outermost part, where the profile ends at the deck's edge (ends.deck,
// or within RAIL_NEAR of it), or, with no deck mapped, where it ends in open space after a sidewalk or cycle track
// (derive.js ends a street on a bridge behind its outer sidewalk). Not where a building, a fence or water ends it, nor
// where a railing is already drawn there. result: deriveProfile's (segments left to right from extent[1] down to
// extent[0]); way: the clicked street; decks: deckSpans; ends: orthoOsmPolys' ends. Returns the sides given one.
// ?off=zabradli: none.
// The strip an estimate leaves unnamed ("nezname", "plocha") at the outer side of a street on a bridge, between its
// roadway and the end of the profile (the deck's edge or open space), is the bridge's sidewalk (Bára 27. 11. 2026:
// Augustusbrücke in Dresden, two metres of "Ostatní" at both edges, in fact sidewalks). Only the estimate's own strip
// (source "odhad", so still marked as an estimate), only beside a roadway part, up to BRIDGE_WALK_MAX m wide. Returns the
// number of strips changed (not on a motorway, motorroad or a way tagged without a sidewalk).
const BRIDGE_WALK_MAX = 4.5, BRIDGE_WALK_FROM = new Set(["nezname", "plocha"]);
const BRIDGE_ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj", "krajnice", "parkovani", "cyklopruh", "ochranny_pruh", "obsluzna"]);
export function bridgeWalks(result, way) {
  const t = way?.tags;
  if (!onBridge(t) || !result?.segments?.length) return 0;
  // Not on a motorway or a motorroad, nor where OSM says there is no sidewalk: the strip is a verge there.
  if (/^motorway/.test(t.highway) || t.motorroad === "yes" || ["no", "none"].includes(t.sidewalk) || (["no", "none"].includes(t["sidewalk:left"]) && ["no", "none"].includes(t["sidewalk:right"]))) return 0;
  const segs = result.segments;
  let n = 0;
  for (const [i, inner] of [[0, 1], [segs.length - 1, segs.length - 2]]) {
    const s = segs[i], r = segs[inner];
    if (!s || !r || i === inner || s.source !== "odhad" || !BRIDGE_WALK_FROM.has(s.type) || !BRIDGE_ROADWAY.has(r.type) || s.width > BRIDGE_WALK_MAX) continue;
    s.type = "chodnik"; n++;
  }
  return n;
}
const RAIL_NEAR = 1.0, RAIL_PARTS = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "cyklostezka", "zelen", "plocha", "nastupiste"]);
export function bridgeRailings(result, way, decks, ends) {
  const out = [];
  if (P.off?.has("zabradli") || !onBridge(way?.tags) || !result?.extent || !result.segments?.length) return out;
  const segs = result.segments;
  for (const [side, edgeKey, seg, f, t] of [["B", "left", segs[0], 0, result.extent[1]], ["A", "right", segs.at(-1), 1, result.extent[0]]]) {
    const edge = result.edges?.[edgeKey];
    if (edge && edge !== "volno") continue;
    if ((seg.items || []).some((it) => it.kind === "zabradli" && Math.abs(it.f - f) < 0.25)) continue;
    const sg = side === "A" ? -1 : 1;
    const d = decks && deckAt(decks, t - sg * 0.5), edgeT = ends?.deck?.[side] ?? (d ? (sg > 0 ? d.e : d.s) : null);
    const atDeck = edgeT !== null && Math.abs(edgeT - t) <= RAIL_NEAR;
    const noDeck = !decks && RAIL_PARTS.has(seg.type);
    if (!atDeck && !noDeck) continue;
    (seg.items ||= []).push({ kind: "zabradli", f, bridge: true });
    out.push(side);
  }
  return out;
}
