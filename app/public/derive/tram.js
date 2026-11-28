// Tram and rail: track axes, beds, surfaces of beds, tram lanes, widening and carving of tram parts.
import { city } from "../city.js";
import { inside, round } from "./geometry.js";

// Outer half-width of a tram track lane from its axis (m). IPR Manuál tvorby veřejných
// prostranství C.2: double-track belt 6.5 m at 3.0 m track spacing, 7 m at 3.5 m,
// i.e. 1.75 m from each outer axis; between tracks the space splits at the midpoint.
export const TRAM_HALF = 1.75;
export const TRAM_LANE_HALF = 1.5; // a tram kept to a 3.0 m lane, where OSM counts car lanes beside the tracks
export const CAR_MIN = 2.5; // narrowest leftover space treated as a separate car lane (m)

// The surface of a separate tram bed from the OSM tram ways in it: grass, gravel (ballast), asphalt or panels
// (other paving: concrete, plates, sett); unknown → decided by bedSurfaces below, as an estimate.
const BED_OF_SURFACE = { grass: "trava", grass_paver: "trava", gravel: "strk", fine_gravel: "strk", ballast: "strk", pebblestone: "strk", asphalt: "asfalt" };
export function bedOf(cross, r) {
  const tags = cross.filter((c) => c.t > r.s - 0.3 && c.t < r.e + 0.3 && c.way.tags?.railway === "tram").map((c) => c.way.tags);
  for (const t of tags) {
    const v = t["railway:track_bed"] || t["tram:bed"] || t.surface;
    if (BED_OF_SURFACE[v]) return { kind: BED_OF_SURFACE[v], source: "osm" };
    if (v) return { kind: "panely", source: "osm" };
  }
  return { kind: "panely", source: "odhad" };
}
// A bed no source describes (Bára 10. 11. 2026, A/B in evaluation/archive/rules-2026-11/REPORT.md, section 4): grass
// where the orthophoto is green (ortho.js), else the rules: asphalt where buses use the tracks (nowadays mostly
// asphalt); panels in a pedestrian street; gravel for a bed beside the street (a roadway on one side only) or
// BED_WIDE or more between two carriageways; panels in a narrower bed between carriageways. Each stays marked
// as an estimate. segs: the parts in cut order (s, e); rails: track axes; ortho: the
// orthophoto (ortho.js bedOrtho, or none); at: offset → point; dir: along the street; highway: the street's.
const BED_WIDE = 6;
const ROADWAY_PART = new Set(["pruh", "pruh_piktokoridor", "obsluzna", "krajnice", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "parkovani", "cyklopruh", "ochranny_pruh"]);
export function bedSurfaces(segs, { rails = [], ortho, at, dir, highway } = {}) {
  for (let i = 0; i < segs.length; i++) {
    if (segs[i].type !== "tramvaj" || segs[i].bedSource !== "odhad") continue;
    let j = i;
    while (segs[j + 1]?.type === "tramvaj" && segs[j + 1].bedSource === "odhad") j++;
    const bed = segs.slice(i, j + 1), s = bed[0].s, e = bed.at(-1).e;
    const seen = ortho?.look && at ? ortho.look(s, e, rails.filter((t) => t > s && t < e), at, dir)?.kind : null;
    const bus = bed.some((x) => x.withBus);
    const between = segs.slice(0, i).some((x) => ROADWAY_PART.has(x.type)) && segs.slice(j + 1).some((x) => ROADWAY_PART.has(x.type));
    const kind = seen === "trava" ? "trava"
      : bus ? "asfalt"
      : highway === "pedestrian" || city.bedPanels ? "panely" // Plzeň: mostly panel beds about 6 m wide (A/B)
      : !between || e - s >= BED_WIDE - 1e-9 ? "strk" : "panely";
    for (const x of bed) Object.assign(x, { bed: kind, bedSource: "odhad" });
    i = j;
  }
  return segs;
}

export const RAIL_HALF = 0.7175; // half the track gauge of 1435 mm: rail from the track axis (m)

// Lanes around tram tracks lying in the roadway: each track gets its swept envelope
// (axis ± TRAM_HALF); leftover space wide enough for a car becomes a driving lane,
// narrower leftovers are added to the neighbouring tram lane.
// Track axes the cut crosses closer together than two parallel tracks can lie (the least axis spacing is about
// 2.8 m, the Manuál's double track 3.0 m) are one track seen at an angle: the branches of a turnout or a crossing in
// a junction (Smetanovo nábřeží at Národní, four axes 1.6, 1.6 and 3.1 m apart drew three trams side by side: report
// of 16. 11. 2026). Such a group is one track at the mean of its axes.
const TRACK_SPACING_MIN = 2.5;
export function mergeTrackAxes(ts) {
  const sorted = [...ts].sort((a, b) => a - b), groups = [];
  for (const t of sorted) {
    const g = groups[groups.length - 1];
    if (g && t - g[g.length - 1] < TRACK_SPACING_MIN) g.push(t); else groups.push([t]);
  }
  return groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
}

// A town's map that draws the tram bed (MTVU 705: Berlin's Gleiskörper, Vienna's FMZK, a passport) puts the tracks
// where they are; OSM's may lie a metre beside it (Neue Schönhauser Straße in Berlin: Bára 18. 11. 2026, the OSM tracks
// 1 m south of the bed left 0.8 m for the parking OSM tags on that side). The OSM tracks of a bed the cut crosses are
// moved into it when a rail lies more than BED_SLACK outside: the group centred in the bed, keeping its spacing. Where
// the bed is part of the roadway (Berlin's Gleiskörper with the rails in the asphalt) and the spacing does not fit, a
// double track lies 1.5 m each side of the bed's centre (Manuál C.2: 3 m). A separate bed narrower than the pair keeps
// OSM's tracks: it draws its own trams by its width, and a track taken out of the roadway beside it would be lost
// (Oranienburger Straße at Oranienburger Tor: a bed of 4.6 m, tracks 3.5 m apart). Measured axes (Prague's DTM, code
// 55010) and beds drawn from OSM itself (ortho-osm.js) are left alone. ?off=tramsnap: the A/B.
const BED_NEAR = 2.5; // OSM tracks this far beyond a bed's edge belong to it (m)
const BED_SLACK = 0.25; // a rail this far beyond the bed's edge is within the data's accuracy (m)
// A strip of bed narrower than a tram (Vienna's FMZK at Rotundenbrücke: 1.6 m beside the track) holds no track, and a
// track further off than BED_SHIFT_MAX is not this bed's (the four Berlin cuts moved 0.4–1.1 m).
const BED_MIN = 2.5, BED_SHIFT_MAX = 1.25;
export function mapTramBeds(polys, center, normal, half, isRoad) {
  const spans = [];
  for (const p of polys) {
    if (p.code !== 705 || p.level || /\(OSM\)/.test(p.label || "")) continue;
    const [x0, y0, x1, y1] = p.bbox || [-Infinity, -Infinity, Infinity, Infinity];
    let lo = null;
    for (let t = -half; t <= half + 1e-9; t += 0.1) {
      const [x, y] = [center[0] + normal[0] * t, center[1] + normal[1] * t];
      const inP = x >= x0 && x <= x1 && y >= y0 && y <= y1 && inside(p.rings, x, y);
      if (inP && lo === null) lo = t;
      if (!inP && lo !== null) { spans.push([lo, t - 0.1, isRoad(p)]); lo = null; }
    }
    if (lo !== null) spans.push([lo, half, isRoad(p)]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const sp of spans) {
    const m = merged[merged.length - 1];
    if (m && sp[0] <= m[1] + 0.15) { m[1] = Math.max(m[1], sp[1]); m[2] ||= sp[2]; } else merged.push([...sp]);
  }
  return merged.filter(([a, b]) => b - a >= BED_MIN);
}
export function snapTracksToBeds(ts, beds) {
  const used = new Set();
  for (const [lo, hi, road] of beds) {
    const idx = ts.map((t, i) => i).filter((i) => !used.has(i) && ts[i] >= lo - BED_NEAR && ts[i] <= hi + BED_NEAR);
    if (!idx.length) continue;
    idx.forEach((i) => used.add(i));
    const mine = idx.map((i) => ts[i]), a = Math.min(...mine), b = Math.max(...mine);
    if (a - RAIL_HALF >= lo - BED_SLACK && b + RAIL_HALF <= hi + BED_SLACK) continue;
    const c = (lo + hi) / 2, to = new Map();
    if (b - a + 2 * RAIL_HALF <= hi - lo) idx.forEach((i) => to.set(i, ts[i] + c - (a + b) / 2));
    else if (road && idx.length === 2) { const [i, j] = ts[idx[0]] <= ts[idx[1]] ? idx : [idx[1], idx[0]]; to.set(i, c - 1.5).set(j, c + 1.5); }
    if (to.size && [...to].every(([i, t]) => Math.abs(t - ts[i]) <= BED_SHIFT_MAX)) for (const [i, t] of to) ts[i] = t;
  }
  ts.sort((x, y) => x - y);
}

export function tramLanes(s, e, trams, dirAt, half = TRAM_HALF) {
  const ts = [...trams].sort((a, b) => a - b);
  const src = trams.measured ? "dtm" : "osm";
  const env = ts.map((t) => ({ s: Math.max(s, t - half), e: Math.min(e, t + half), t }));
  for (let i = 0; i < env.length - 1; i++) {
    // Overlapping or close envelopes split the space between them in the middle.
    const gap = env[i + 1].s - env[i].e;
    if (gap < CAR_MIN) env[i].e = env[i + 1].s = (env[i].e + env[i + 1].s) / 2;
  }
  const dirOf = dirAt;
  const out = [];
  const carGap = (a, b) => {
    const n = Math.max(1, Math.floor((b - a) / 2.75));
    const w = (b - a) / n;
    for (let k = 0; k < n; k++) out.push({ type: "pruh", s: a + k * w, e: a + (k + 1) * w, dir: dirOf(a + (k + 0.5) * w), source: src });
  };
  if (env[0].s - s >= CAR_MIN) carGap(s, env[0].s); else env[0].s = s;
  for (let i = 0; i < env.length - 1; i++) if (env[i + 1].s - env[i].e >= CAR_MIN) carGap(env[i].e, env[i + 1].s);
  const last = env[env.length - 1];
  const firstAbsorbed = env[0].s === s;
  if (e - last.e >= CAR_MIN) carGap(last.e, e); else last.e = e;
  // Two tracks filling the whole roadway (no car lane beside them): each takes half of it, split in the roadway's
  // middle. The axes of OSM and the kerbs read on the photo seldom agree to the metre, and the rest of the roadway
  // went to one track (Josefstädter Straße: trams of 5.4 and 2.3 m).
  if (env.length === 2 && firstAbsorbed && last.e === e && Math.abs((ts[0] + ts[1]) / 2 - (s + e) / 2) < 2) env[0].e = env[1].s = (s + e) / 2;
  // Trams keep right too: tracks right of the middle of the tram belt run with the street.
  const mid = (ts[0] + ts[ts.length - 1]) / 2;
  const trackDir = (t) => (ts.length === 1 ? dirOf(t) : t > mid ? "backward" : "forward");
  for (const x of env) out.push({ type: "tramvaj_v_pruhu", s: x.s, e: x.e, dir: trackDir(x.t), source: src });
  return out;
}

// A tram lane narrower than a lane (3.0 m, the approved lane) cannot hold a tram: the photo put the kerb across the
// track (Josefstädter Straße in 2019: 1.97 m). It takes the rest from the sidewalk or paving beside it, which keeps
// at least 1.5 m. Returns the parts widened.
const TRAM_LANE_MIN = 3.0;
const TAKE_FROM = new Set(["chodnik", "plocha", "nezname", "zelen"]);
export function widenNarrowTrams(segments) {
  let n = 0;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (!["tramvaj_v_pruhu", "tramvaj_pruh"].includes(s.type) || s.width >= TRAM_LANE_MIN) continue;
    for (const j of [i - 1, i + 1]) {
      const nb = segments[j], need = +(TRAM_LANE_MIN - s.width).toFixed(2);
      if (!nb || !TAKE_FROM.has(nb.type) || nb.width - need < 1.5) continue;
      nb.width = +(nb.width - need).toFixed(2); s.width = TRAM_LANE_MIN; n++;
      break;
    }
  }
  return n;
}

// Tram tracks of OSM across a part the profile only estimated (a median, unknown, green or paved; Vajanského nábrežie,
// Botanická, Staničné námestie): a tram bed of TRAM_TRACK m a track about them, cut out of that part (its own part
// when the tracks fill it).
const TRAM_TRACK = 3.3, CARVE_TRAM = new Set(["delici", "nezname", "zelen", "plocha"]);
export function carveTramTracks(segments, cross = []) {
  // One track mapped twice (two ways 0.1 m apart: Staničné námestie) is one.
  const rails = cross.filter((c) => c.tags?.railway === "tram").map((c) => c.at).sort((a, b) => a - b).filter((t, k, all) => !k || t - all[k - 1] > 1.5);
  let n = 0;
  for (let q = 0; q < segments.length; q++) {
    const part = segments[q];
    if (!CARVE_TRAM.has(part.type) || part.source === "dtm") continue;
    let x = 0;
    for (let r = 0; r < q; r++) x += segments[r].width;
    const inside = rails.filter((t) => t > x && t < x + part.width);
    if (!inside.length) continue;
    const w = Math.min(part.width, inside.length * TRAM_TRACK), mid = (inside[0] + inside.at(-1)) / 2;
    let a = Math.max(x, Math.min(mid - w / 2, x + part.width - w)), b = a + w;
    if (a - x < 0.5) a = x;
    if (x + part.width - b < 0.5) b = x + part.width;
    const beds = inside.map((_, k) => ({ type: "tramvaj", width: round((b - a) / inside.length), source: "osm", bed: "panely", bedGuess: true }));
    const pieces = [...(a - x > 0 ? [{ ...part, width: round(a - x) }] : []), ...beds, ...(x + part.width - b > 0 ? [{ ...part, width: round(x + part.width - b) }] : [])];
    segments.splice(q, 1, ...pieces);
    q += pieces.length - 1;
    n++;
  }
  return n;
}
