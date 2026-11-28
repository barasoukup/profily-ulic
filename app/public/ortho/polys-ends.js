import { TILE } from "../osmtile.js";
import { RAILWAY_CODE } from "../types.js";
import { crossT, sameLevel } from "./osm-along.js";
import { deckAt } from "./bridges.js";
import { MAX_RAILS, RAIL_GAP, TRACK_HALF, heavyRail, railHalf, railTracks } from "./rail.js";
import { ONEWAY, STREET } from "./road-tags.js";
import { P } from "./settings.js";
import { SIDEWALK } from "./measures.js";

// The ends of the sides of a street, the deck of a bridge and the railway beside it (parts of orthoOsmPolys, polys.js).
// m: a deck edge nearer the kerb (or inside the roadway) does not end the street: OSM drew the roadway only, or roughly
// (e-18, e-13: sidewalks of 0.34 and 0.82 m left)
export const DECK_MIN = 1.0;
const TWIN_DECK = 20; // m: the axis of the street's other carriageway on a deck of its own at most this far past the kerb (Route des Jeunes, e-43: its twin 35 m off, beyond a motorway's two decks, is not the same cross-section)
const LAST_WALK = 15, LAST_NONE = 2; // m: the next thing of the street at most this far on; with none, this past the kerb

// Where a side without a house ends (Bára 17. 11. 2026, Smetanovo nábřeží: the profile ran on over the ground below
// the street on both sides): at the first steps (a change of level), fence or wall OSM maps across the cut beyond the
// kerb, or the fenced edge of a park.
// Where the carriageway OSM says ends on a side (its lanes' width about the axis): a track beyond it is no embedded one,
// whatever kerb the image found (the track's bed reads as roadway on it).
export function findSideEnds(cx) {
  const { stretch, tu, o, pair, road, k, k2, road2, pSide } = cx;
  const edgeOf = (side) => { const out = k2 && side === pSide; return (out ? pair.t : o.own.t) + (side === "A" ? -1 : 1) * (out ? road2 : road).reach[side]; };
  const ends = { A: null, B: null }, hard = { A: null, B: null }, chain = { A: [], B: [] }, reached = { A: null, B: null };
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    if (o.facade[side] !== null) continue;
    const kerbT = (k2 && side === pSide ? k2 : k)[side];
    const cand = [
      ...o.ways.filter((w) => sameLevel(w, o) && (w.tags.highway === "steps" || ["fence", "wall", "retaining_wall", "city_wall"].includes(w.tags.barrier))).map((w) => w.t),
      // A fenced green area's edge (barrier on the area; tools/build_osm_tiles.mjs keeps it), not where a tile cut it.
      ...o.greens.filter((g) => ["fence", "wall"].includes(g.tags?.barrier)).flatMap((g) => {
        const r = [...g.geometry, g.geometry[0]], onBorder = (a, b) => [["lon", a.lon, b.lon], ["lat", a.lat, b.lat]].some(([, x, y]) => x === y && Math.abs(x / TILE - Math.round(x / TILE)) < 1e-6);
        const out = [];
        for (let i = 0; i + 1 < r.length; i++) if (!onBorder(r[i], r[i + 1])) out.push(...crossT([r[i], r[i + 1]].map((q) => tu(q.lon, q.lat)), 45).map((x) => x.t));
        return out;
      }),
    ].filter((t) => sg * (t - kerbT) > 0.5 && Math.abs(t - o.own.t) < 40);
    if (cand.length) { ends[side] = hard[side] = cand.reduce((a, b) => (sg * (b - a) < 0 ? b : a)); continue; }
    // No such end: the side ends just beyond the last thing of the street OSM maps there (a sidewalk or path, a cycle
    // track, tram tracks, another carriageway), each LAST_WALK within the one before; nothing there: LAST_NONE past the
    // kerb (Bára 17. 11. 2026, Generála Šišky: "když nic pak není, tak se řez vezme jen po poslední zajímavý prvek").
    // A sidewalk mapped apart is drawn as one.
    const things0 = o.ways.filter((w) => sameLevel(w, o) && (heavyRail(w, o) ? sg * (w.t - edgeOf(side)) > 0.3 : sg * (w.t - kerbT) > 0.3) && Math.abs(w.t - o.own.t) < 40 && (w.tags.railway === "tram" || heavyRail(w, o) || ["footway", "path", "pedestrian", "cycleway", "steps"].includes(w.tags.highway) || (STREET.test(w.tags.highway || "") && w.tags.highway !== "service")))
      .sort((a, b) => sg * (a.t - b.t));
    const things = things0.filter((w) => !heavyRail(w, o) || railTracks(things0.filter((x) => heavyRail(x, o))).includes(w));
    let last = kerbT, lastW = null;
    let nRail = 0;
    for (const w of things) {
      if (sg * (w.t - last) > (heavyRail(w, o) ? RAIL_GAP : LAST_WALK)) break;
      if (heavyRail(w, o) && ++nRail > MAX_RAILS) break;
      if (sg * (w.t - last) > 0) last = w.t;
      lastW = w; chain[side].push(w);
    }
    const halfOf = (w) => (w?.tags.railway === "tram" ? TRACK_HALF : w && heavyRail(w, o) ? railHalf(w) : w?.tags.highway === "cycleway" ? 1.3 : STREET.test(w?.tags.highway || "") ? 3 : SIDEWALK / 2);
    // Nothing mapped there: a soft end, moved out past the estimate's own last sidewalk, parking or tree row (trimToEnds).
    // The side the user stretched beyond the usual reach (Bára 27. 11. 2026, Tikkurilantie in Vantaa and Via Leopardi in Merano:
    // the profile stopped at the cycle track or sidewalk with a lawn and a wood beyond it): no end at the last thing; the
    // lawn, other areas and things go on to the reach, or to a house, a fence or a wall (above). stretch: { A: true, B: false }
    // from app.js (a reach beyond MAX_REACH that the user set). on by default, ?dosah=0 off (Bára 27. 11. 2026; evaluation/archive/railway/REPORT.md).
    if (stretch?.[side] && P.stretchOn) { ends[side] = null; continue; }
    ends[side] = lastW ? (sg > 0 ? Math.max : Math.min)(last + sg * halfOf(lastW), ...chain[side].map((w) => w.t + sg * halfOf(w))) : kerbT + sg * LAST_NONE;
    if (!lastW) (ends.soft ??= {})[side] = true;
  }
  Object.assign(cx, { ends, hard, chain, reached, edgeOf });
}

// A street on a bridge ends at the edge of its deck (Bára 26. 11. 2026: "pokud je to na mostě, tak bych to ukončila
// hranicí té plochy"): the deck holding the outermost kerb on each side, its edge at least DECK_MIN beyond the kerb (a
// narrower deck than the roadway is OSM's mistake), a hard end wherever the side would reach past it (trimToEnds).
// ends.deck: the sides so ended (bridgeRailings). ?off=mostdeska: none (deckSpans gives null).
// The other carriageway of the street on a deck of its own (two bridges side by side, the gap between them: e-12, e-36
// of evaluation/archive/bridge-water/edge) belongs to the street: the end is that deck's edge. Such a carriageway: a road of
// the street's level within 40 m, of its name or ref (one of them unnamed: of its class, both one-way; Autoroute des
// Cigognes and its unnamed twin, M 35 both). A soft end (nothing of OSM beyond the kerb, trimToEnds reaches out to the
// street's own last part) stays soft, only never past the deck (cap). A road of another name on the next deck (a
// motorway's slip road beside N579a, e-12) is not the street's.
export function capAtDecks(cx) {
  const { decks, o, k, k2, pSide, overGround, ends } = cx;
  const own = o.own.tags;
  const sameStreet = (w) => STREET.test(w.tags.highway || "") && sameLevel(w, o) && Math.abs(w.t - o.own.t) < 40 &&
    ((own.name && w.tags.name === own.name) || (own.ref && w.tags.ref === own.ref) || ((!own.name || !w.tags.name) && w.tags.highway === own.highway && ONEWAY(w.tags) && ONEWAY(own)));
  if (decks && overGround) for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const kerbT = (k2 && side === pSide ? k2 : k)[side];
    let d = deckAt(decks, kerbT, 0.3);
    if (!d) continue;
    for (const w of o.ways.filter((x) => sg * (x.t - kerbT) > 0 && sg * (x.t - kerbT) <= TWIN_DECK && sameStreet(x))) {
      const d2 = deckAt(decks, w.t);
      if (d2 && sg * ((sg < 0 ? d2.s : d2.e) - (sg < 0 ? d.s : d.e)) > 0) d = d2;
    }
    const edge = sg < 0 ? d.s : d.e;
    if (sg * (edge - kerbT) < DECK_MIN) continue;
    if (ends.soft?.[side]) (ends.cap ??= {})[side] = edge;
    else if (ends[side] === null || sg * (ends[side] - edge) > 0) ends[side] = edge;
    (ends.deck ??= {})[side] = edge;
  }
}

// The railway beside the street: its tracks beyond the carriageway OSM says, each a bed of its width, drawn before the
// carriageway (the bed of gravel reads as roadway on the image, and the sidewalk and the rest come after it). On a
// side with a house up to it; the side without one has its tracks in chain (the end of the side reaches them).
export function addRailBeds(cx) {
  const { o, k, k2, pSide, rect, polys, edgeOf } = cx;
  if (!P.off?.has("railway")) for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const out = k2 && side === pSide, kerb = out ? k2[side] : k[side], f = o.facade[side];
    if (out) continue;
    const all = o.ways.filter((w) => heavyRail(w, o) && sg * (w.t - edgeOf(side)) > 0.3 && sg * (w.t - o.own.t) < 40);
    const tracks = railTracks(all).sort((a, b) => sg * (a.t - b.t));
    const beds = [];
    let last = kerb;
    for (const w of tracks) {
      if (sg * (w.t - last) > RAIL_GAP || beds.length >= MAX_RAILS) break;
      // The bed starts at the image's kerb where the track's axis lies beyond it (it must not bite into the roadway).
      const h = railHalf(w), a0 = w.t - sg * h, a = sg * (w.t - kerb) > 0 && sg * (a0 - kerb) < 0 ? kerb : a0, b = f !== null && sg * (w.t + sg * h - f) > 0 ? f : w.t + sg * h;
      if (f !== null && sg * (f - w.t) < 0.5) break;
      beds.push(rect(RAILWAY_CODE, "železnice (OSM)", ...(sg < 0 ? [b, a] : [a, b])));
      if (sg * (w.t - last) > 0) last = w.t;
    }
    polys.splice(0, 0, ...beds);
  }
}
