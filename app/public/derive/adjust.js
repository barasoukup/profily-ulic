// Adjustments of the finished parts: splitting two-way lanes, capping wide lanes, cycleways, tracks, shoulders.
import { country } from "../city.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { isOnewayTags } from "./tags.js";
import { round } from "./geometry.js";
import { KRAJNICE_MIN, LANE_CAP, LANE_CAP_DEFAULT, sideTags } from "./lanes.js";

// A two-way street left with a single lane of 5 m or more (the orthophoto's lines found no centre line, or the
// estimate measured a wide roadway) has two lanes, one each way: the rule of 2 × 2.5 m from 5.0 m (Manuál C.2;
// 1000 Slovak cuts: 65 lanes over 4.6 m, most of them such). Not a zone (one paved roadway), a one-way street, a
// roundabout, a street with trams or of several roadways. The lanes keep the old one's source.
export const TWO_WAY_SPLIT = 5.0;
// Where the street's lanes are counted (OSM lanes ≥ 2, or a map's inventory a module adds to the way's tags) and parking
// stands beside the roadway, a two-way roadway of one lane is split from 4.0 m (Bára 24. 11. 2026, the USA pilot: DDOT
// counts two lanes of 8 ft on its local streets of 16 ft, and the roadway left beside the parking strips measured
// 4.25–4.55 m; all the judged cuts there had the strips). Without parking a roadway of 4.25 m is one lane (Odlehlá in
// Prague, evaluation/archive/unification/praha). ?off=pocetpruhu: 5.0 m.
export const TWO_WAY_SPLIT_COUNTED = 4.0;
export function splitTwoWayLane(segments, tags = {}) {
  // OSM lanes=1 on a two-way road is a single-lane road (passing places): kept.
  if (isOnewayTags(tags) || tags.junction === "roundabout" || tags.lanes === "1" || ["living_street", "pedestrian", "service", "track"].includes(tags.highway)) return 0;
  const lanes = segments.filter((s) => s.type === "pruh");
  if (lanes.length !== 1 || segments.some((s) => /^tramvaj|^bus/.test(s.type))) return 0;
  const lane = lanes[0];
  let i = segments.indexOf(lane), n = 1;
  // Where OSM counts two lanes or more, a shoulder of 1.5 m or more beside the single lane is the other lane: the
  // orthophoto took the centre line for an edge line (Hroboňova in Bratislava: lane 4.03 + shoulder 2.17 m, two-way
  // with trolley wires and no parked cars). Narrower shoulders from edge lines stay (Bára).
  // One shoulder only, the narrower one where both are that wide (Práznovská cesta: 2.27 | 3.9 | 3.43 m).
  if ((+tags.lanes || 0) >= 2) {
    const r = segments[i + 1]?.type === "krajnice" && segments[i + 1].width >= 1.5 ? segments[i + 1].width : Infinity;
    const l = segments[i - 1]?.type === "krajnice" && segments[i - 1].width >= 1.5 ? segments[i - 1].width : Infinity;
    if (r < Infinity && r <= l) n++;
    else if (l < Infinity) { i--; n++; }
  }
  const width = round(segments.slice(i, i + n).reduce((a, x) => a + x.width, 0));
  const beside = [segments[i - 1], segments[i + n]].some((x) => x?.type === "parkovani");
  const split = (+tags.lanes || 0) >= 2 && beside && !ORTHO_P.off?.has("pocetpruhu") ? TWO_WAY_SPLIT_COUNTED : TWO_WAY_SPLIT;
  if (!(width >= split - 1e-6)) return 0;
  const half = round(width / 2);
  const { turn, ...rest } = lane;
  const [d0, d1] = country.leftHand ? ["forward", "backward"] : ["backward", "forward"];
  segments.splice(i, n, { ...rest, width: half, dir: d0 }, { ...rest, width: round(width - half), dir: d1 });
  return 1;
}

// A lane wider than the cap of its street by a shoulder or more (the orthophoto's lines measured a one-way street
// of 5.6–6.1 m as one lane; 1000 Slovak cuts): the cap's rule after them too (Bára: lane 4 m, local 4.5 m, the rest a
// shoulder, drawn from 1 m, an estimate). The shoulder goes to the lane's kerb side (both halves where both sides
// are kerbs and the rest is two shoulders); a lane between lanes stays. Not in a zone.
const DRIVE = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "obsluzna", "krajnice", "cyklopruh", "ochranny_pruh", "tramvaj"]);

// A pedestrian zone is a sidewalk (Bára 17. 11. 2026: "pěší zóna je vlastně chodník, měla by se kreslit s lidmi, ne
// s auty"; a living street or a shared zone keeps its lane): the lanes and shoulders of a highway=pedestrian become
// sidewalk, joined with the sidewalks beside them. Trams, bicycles and parking stay. A roadway the technical map
// really draws there stays a lane (measured; Bára: "pokud je v datech fakt pruh, tak nakreslit, ale spíš se tomu
// vyhýbat"): only the estimate's lanes go. Returns the parts changed (?off=pesizona).
const ZONE_ROAD = new Set(["pruh", "pruh_piktokoridor", "krajnice", "obsluzna"]);
export function pedestrianZone(segments, tags = {}, { measured = false } = {}) {
  if (tags.highway !== "pedestrian" || measured || ORTHO_P.off?.has("pesizona")) return 0;
  let n = 0;
  for (const s of segments) if (ZONE_ROAD.has(s.type)) { s.type = "chodnik"; delete s.dir; delete s.lanes; n++; }
  // What the estimate left unknown in a pedestrian zone (wider paving than it dares to call anything) is the zone's
  // own walking surface too.
  for (const s of segments) if (s.type === "nezname" && s.source !== "user") { s.type = "chodnik"; n++; }
  if (!n) return 0;
  for (let i = segments.length - 1; i > 0; i--) {
    const [a, b] = [segments[i - 1], segments[i]];
    if (a.type === "chodnik" && b.type === "chodnik" && !a.items?.length && !b.items?.length) { a.width = +(a.width + b.width).toFixed(2); if (a.e !== undefined && b.e !== undefined) a.e = Math.max(a.e, b.e); segments.splice(i, 1); }
  }
  return n;
}

export function capWideLanes(segments, tags = {}) {
  if (["living_street", "pedestrian"].includes(tags.highway)) return 0;
  const cap = LANE_CAP[tags.highway] ?? LANE_CAP_DEFAULT;
  let n = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    const lane = segments[i];
    if (lane.type !== "pruh" || !(lane.width - cap >= KRAJNICE_MIN - 1e-6)) continue;
    const nL = segments[i - 1], nR = segments[i + 1], isK = (x) => x?.type === "krajnice";
    const kerbL = !DRIVE.has(nL?.type) || isK(nL), kerbR = !DRIVE.has(nR?.type) || isK(nR);
    if (!kerbL && !kerbR) continue;
    const excess = round(lane.width - cap);
    // A shoulder already beside the lane takes the rest (no two shoulders side by side: Chorvátska, Viedenská).
    const into = isK(nR) ? nR : isK(nL) ? nL : null;
    if (into) {
      into.width = round(into.width + excess); into.source = "odhad";
      lane.width = cap; n++; continue;
    }
    const both = kerbL && kerbR && excess >= 2 * KRAJNICE_MIN - 1e-6;
    const sh = (w) => ({ type: "krajnice", width: round(w), source: "odhad" });
    const parts = both ? [sh(excess / 2), { ...lane, width: cap }, sh(excess - round(excess / 2))]
      : kerbR ? [{ ...lane, width: cap }, sh(excess)] : [sh(excess), { ...lane, width: cap }];
    segments.splice(i, 1, ...parts);
    n++;
  }
  return n;
}

// A cycle track OSM maps on its own across a part the profile only estimated (paved area, shoulder, unknown, green;
// a town's passport filler; 11 of 35 missing cycle tracks on 995 Slovak streets after fix 5: Pod Párovcami's 4.15 m
// shoulder, Wolkerova's paved area): a strip of its width (OSM width, else 2 m one-way, 2.5 m) cut out of the part about
// its line; scraps under 0.3 m go to it. Not where a bicycle part lies within 2 m. cross: [{ at (m from A), tags }].
const CARVE_BIKE = new Set(["plocha", "krajnice", "nezname", "zelen"]);
const BIKE_PARTS = new Set(["cyklostezka", "cyklopruh", "ochranny_pruh", "chodnik_kola", "stezka_sdilena", "bus_cyklo"]);
const isCycleWay = (t) => t.highway === "cycleway" || (["path", "footway"].includes(t.highway) && t.bicycle === "designated");
export function carveCycleways(segments, cross = []) {
  let n = 0;
  for (const c of cross.filter((x) => isCycleWay(x.tags || {}))) {
    let x = 0, i = -1;
    for (let q = 0; q < segments.length; q++) { if (c.at > x && c.at < x + segments[q].width) { i = q; break; } x += segments[q].width; }
    if (i < 0) continue;
    const part = segments[i];
    // Green a map measured stays green (Ostrava, Na Jízdárně: the technical map's 2.15 m strip); a measured paved area
    // may hold the cycle track (Wolkerova: the passport's "other" area).
    if (!CARVE_BIKE.has(part.type) || (part.type === "zelen" && ["dtm", "pasport"].includes(part.source))) continue;
    let y = 0;
    const near = segments.some((s) => { const s0 = y; y += s.width; return BIKE_PARTS.has(s.type) && s0 - 2 < c.at && c.at < y + 2; });
    if (near) continue;
    const w = Math.min(part.width, parseFloat(String(c.tags.width || "").replace(",", ".")) || (c.tags.oneway === "yes" ? 2 : 2.5));
    let a = Math.max(x, Math.min(c.at - w / 2, x + part.width - w)), b = a + w;
    if (a - x < 0.3) a = x;
    if (x + part.width - b < 0.3) b = x + part.width;
    const pieces = [];
    if (a - x > 0) pieces.push({ ...part, width: round(a - x) });
    pieces.push({ type: "cyklostezka", width: round(b - a), source: "osm" });
    if (x + part.width - b > 0) pieces.push({ ...part, width: round(x + part.width - b) });
    segments.splice(i, 1, ...pieces);
    n++;
  }
  return n;
}
// A cycle track along the road that OSM maps only as a tag of the road (cycleway[:left|:right|:both]=track), not as a
// way of its own (the review of 24. 11. 2026: none of 76 cuts in Copenhagen had a cycle track, though 24 % of its streets
// tag one): on that side, just beyond the roadway's outer lane or parking, a cycle track of the OSM width (else
// country.trackWidth, else 2 m) cut out of the estimated parts there (a shoulder, sidewalk, paved area, unknown, green);
// never out of a map's own surfaces (source dtm, pasport), not where a bicycle part lies already at that edge. Its
// direction: the side's traffic, against it for opposite_track or cycleway:<side>:oneway=-1, none for oneway=no.
// along: the profile looks along the way's geometry (the way's left is the profile's left).
const TRACK_FROM = new Set(["krajnice", "chodnik", "plocha", "nezname", "zelen"]);
const OUTER_ROAD = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "obsluzna", "parkovani"]);
export function trackAlongRoad(segments, tags = {}, along = true) {
  const first = segments.findIndex((s) => OUTER_ROAD.has(s.type)), last = segments.findLastIndex((s) => OUTER_ROAD.has(s.type));
  if (first < 0) return 0;
  let n = 0;
  // The right side first, so the left side's indices stay as found.
  for (const [pSide, edge, step] of [["R", last, 1], ["L", first, -1]]) {
    const st = sideTags(tags, pSide === "L" ? (along ? "left" : "right") : along ? "right" : "left");
    if (!st.track) continue;
    // A bicycle part already at that edge (a lane, a track from the map or a way of OSM carved before).
    const next = segments[edge + step];
    if (BIKE_PARTS.has(segments[edge]?.type) || BIKE_PARTS.has(next?.type) || BIKE_PARTS.has(segments[edge + 2 * step]?.type)) continue;
    const want = st.trackWidth > 0.5 && st.trackWidth < 6 ? st.trackWidth : country.trackWidth || 2;
    // The run of estimated parts beyond the edge that may give way.
    let q = edge + step, got = 0;
    const taken = [];
    while (got < want && segments[q] && TRACK_FROM.has(segments[q].type) && !["dtm", "pasport"].includes(segments[q].source)) {
      taken.push(q); got += segments[q].width; q += step;
    }
    if (!taken.length || got < 0.5) continue;
    // The estimate's sidewalk there often holds the track too (the orthophoto shows no kerb between them: Børsgade,
    // Nordre Fasanvej): where no other sidewalk lies beyond, it keeps 1 m when the track still gets 0.8 m.
    const walkBeyond = segments.some((x, r) => (step > 0 ? r > taken.at(-1) : r < taken.at(-1)) && x.type === "chodnik");
    const reserve = taken.some((r) => segments[r].type === "chodnik") && !walkBeyond && got - 1 >= 0.8 ? 1 : 0;
    const width = round(Math.min(want, got - reserve));
    const rightTraffic = (pSide === "R") !== !!country.leftHand;
    const contra = tags[`cycleway:${pSide === "L" ? (along ? "left" : "right") : along ? "right" : "left"}`] === "opposite_track" || st.trackOneway === "-1";
    const dir = st.trackOneway === "no" ? undefined : (rightTraffic !== contra ? "forward" : "backward");
    const track = { type: "cyklostezka", width, source: st.trackWidth ? "osm" : "odhad", ...(dir && { dir }) };
    // What stays of the last part taken (scraps under 0.3 m go to the track).
    const lastQ = taken.at(-1), rest = round(got - width);
    const keep = rest >= 0.3 ? [{ ...segments[lastQ], width: rest }] : [];
    if (rest > 0 && rest < 0.3) track.width = round(got);
    const lo = Math.min(...taken), count = taken.length;
    segments.splice(lo, count, ...(step > 0 ? [track, ...keep] : [...keep, track]));
    n++;
  }
  return n;
}

// A roadway the orthophoto's lines cut into shoulders only, with no lane anywhere in the profile (995 Slovak streets:
// Pluhová 1.67 + 2.43 m, Topoľčianska 3.67 + 4.63 m): the shoulders side by side are the roadway, one lane under 5 m,
// a two-way street's two from 5 m, a one-way street's OSM lanes while each keeps 2.5 m.
export function lanesFromShoulders(segments, tags = {}) {
  if (segments.some((s) => DRIVE.has(s.type) && s.type !== "krajnice")) return 0;
  let i = segments.findIndex((s) => s.type === "krajnice");
  if (i < 0) return 0;
  let j = i;
  while (segments[j + 1]?.type === "krajnice") j++;
  const width = round(segments.slice(i, j + 1).reduce((a, s) => a + s.width, 0));
  if (width < 2.5) return 0;
  const oneway = isOnewayTags(tags);
  // One-way: OSM's lanes, else lanes of about 3.5 m; each at least 2.5 m.
  const n = oneway ? Math.max(1, Math.min(+tags.lanes || Math.round(width / 3.5), Math.floor(width / 2.5))) : width >= TWO_WAY_SPLIT ? 2 : 1;
  const src = segments[i].source;
  const lanes = Array.from({ length: n }, (_, q) => ({ type: "pruh", width: round(q === n - 1 ? width - round(width / n) * (n - 1) : width / n), source: src,
    dir: oneway ? undefined : n === 2 ? ((q === 0) !== !!country.leftHand ? "backward" : "forward") : undefined }));
  segments.splice(i, j - i + 1, ...lanes);
  return 1;
}
