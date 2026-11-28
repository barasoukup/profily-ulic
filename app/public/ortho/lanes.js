import { median } from "./image.js";
import { EDGE_MIN, LANE_MAX, LANE_MIN, OUTER_MAX, brightMap, laneLines } from "./lines.js";
import { HATCH, hatchBands } from "./hatch.js";

// ---------- parking on its own surface ----------
// Parking bays paved differently from the roadway (paving stones beside asphalt: Konopná, Plzeň; Bára): a band at
// a kerb, BAND_MIN–BAND_MAX wide, whose columns differ from the middle of the carriageway in brightness and are far
// more uneven (the stones, the cars on them), while the middle is smooth asphalt. Returns its width or 0.
const BAND_MIN = 1.6, BAND_MAX = 2.8, LANE_LEFT = 2.75;
function surfaceBand(st, s, e, side) {
  const { nt, nu, res, t0, L } = st, col = (t) => {
    const i = Math.round((t - t0) / res - 0.5), v = [];
    for (let j = 0; j < nu; j++) { const x = L[j * nt + i]; if (!Number.isNaN(x)) v.push(x); }
    v.sort((a, b) => a - b);
    return v.length < nu / 2 ? null : { med: v[v.length >> 1], iqr: v[(3 * v.length) >> 2] - v[v.length >> 2] };
  };
  const cols = [];
  for (let t = s + res / 2; t < e; t += res) cols.push({ t, ...col(t) });
  if (cols.some((c) => c.med === undefined)) return 0;
  const core = cols.filter((c) => c.t > s + (e - s) / 3 && c.t < e - (e - s) / 3);
  const coreMed = median(core.map((c) => c.med)), coreIqr = median(core.map((c) => c.iqr));
  if (!(coreIqr < 20)) return 0; // shade or cars over the middle: no smooth roadway to compare with
  const odd = (c) => Math.abs(c.med - coreMed) >= 0.08 * coreMed && c.iqr >= 3 * coreIqr + 8;
  const seq = side === "s" ? cols : [...cols].reverse(), from = (c) => Math.abs(c.t - (side === "s" ? s : e));
  let end = 0, miss = 0, hits = 0;
  for (const c of seq) {
    if (from(c) < 0.2) continue; // the kerb itself
    if (from(c) > BAND_MAX + 0.5) break;
    if (odd(c)) { hits++; miss = 0; end = from(c) + res / 2; } else if (++miss >= Math.round(0.3 / res)) break;
  }
  return end >= BAND_MIN && end <= BAND_MAX && hits >= 0.8 * (end - 0.2) / res && (e - s) - end >= LANE_LEFT ? end : 0;
}
// Splits a lane of the profile at a carriageway's kerb into parking on its own surface and the rest. Returns the
// number of bands found.
function parkingBands(result, st, carriages) {
  let found = 0;
  for (const c of carriages) {
    if (c.s <= st.t0 || c.e >= st.t0 + st.nt * st.res) continue;
    for (const side of ["s", "e"]) {
      const w = surfaceBand(st, c.s, c.e, side);
      if (!w) continue;
      // The profile's part at that kerb (laid from extent[0] up, as below).
      let t = result.extent[0], at = null;
      for (const seg of [...result.segments].reverse()) {
        const ps = t, pe = t + seg.width;
        t = pe;
        const edge = side === "s" ? c.s + 0.1 : c.e - 0.1;
        if (edge >= ps && edge <= pe) { at = seg; break; }
      }
      if (!at || at.type !== "pruh" || at.width < w + LANE_LEFT) continue;
      const i = result.segments.indexOf(at), park = { type: "parkovani", width: +w.toFixed(2), source: "ortofoto", orient: "podelne" };
      at.width = +(at.width - park.width).toFixed(2);
      // Screen order runs from extent[1] down: the low kerb (s) comes after the lane, the high one (e) before.
      result.segments.splice(side === "s" ? i + 1 : i, 0, park);
      found++;
    }
  }
  return found;
}
// ---------- the profile ----------
// Why a carriageway was left as the rules drew it (evaluation only: globalThis.__lanesWhy, an array, collects
// { s, e, why }; nothing happens in the app).
let lastWhy = "";
const why = (c, text) => globalThis.__lanesWhy?.push({ s: c.s, e: c.e, why: text });
const fail = (text) => { lastWhy = text; return null; };
const CARRIAGE = (c) => c === 700 || c === 701 || c === 704 || (c >= 9700 && c < 9800);
const RAISED = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "predzahradka", "zelen", "stromorad", "nastupiste", "cyklostezka", "tramvaj", "railway", "delici", "plocha", "zahradka", "voda", "zed", "nezname"]);
const BLOCK = new Set(["pruh", "krajnice"]);
const SNAP = 0.6;
// ?off=<switch>,<switch>: a rule of this file off for the comparison (the same parameter as app.js ORTHO_P.off).
const ONE_LANE_MAX = 4.25; // a lane wider than this (m) is two where the rules had two
const SHOULDER_MAX = 3.6; // a boundary of other parts (parking, bike lane…) moves to a line this near
// result: deriveProfile's { segments, runs, extent }; img: laneImage(). Returns the number of carriageways changed
// (the segments are changed in place).
export function applyLanes(result, img) {
  if (!img || !result?.segments?.length || !result.runs?.length || !result.extent) return 0;
  const H = brightMap(img.st);
  const mapped = [];
  for (const r of result.runs) {
    if (!CARRIAGE(r.code)) continue;
    const last = mapped.at(-1);
    if (last && Math.abs(last.e - r.s) < 0.05) last.e = r.e; else mapped.push({ s: r.s, e: r.e });
  }
  const bands = parkingBands(result, img.st, mapped);
  // The profile's parts with their positions, and its roadways (runs of parts at road level). The segments are in
  // screen order, from extent[1] down to extent[0] (derive.js), the runs along the cut: the parts are laid from
  // extent[0] up.
  let t = result.extent[0];
  const parts = [...result.segments].reverse().map((s) => { const o = { seg: s, s: t, e: t + s.width }; t += s.width; return o; });
  const ways = [];
  for (const p of parts) {
    if (RAISED.has(p.seg.type)) continue;
    const last = ways.at(-1);
    if (last && Math.abs(last.e - p.s) < 0.01) { last.e = p.e; last.parts.push(p); } else ways.push({ s: p.s, e: p.e, parts: [p] });
  }
  const carriages = [];
  for (const r of result.runs) {
    if (!CARRIAGE(r.code)) continue;
    const last = carriages.at(-1);
    if (last && Math.abs(last.e - r.s) < 0.05) last.e = r.e; else carriages.push({ s: r.s, e: r.e });
  }
  let changed = 0;
  const out = [];
  for (const w of ways) {
    // The carriageway of the map the roadway overlaps most; the profile's positions stretched onto it.
    const over = (c) => Math.max(0, Math.min(c.e, w.e) - Math.max(c.s, w.s));
    const c = carriages.reduce((b, x) => (over(x) > (b ? over(b) : 0) ? x : b), null);
    if (!c || over(c) < 0.5 * (w.e - w.s) || c.s <= img.st.t0 || c.e >= img.st.t0 + img.st.nt * img.st.res) { why(c || w, "bez vozovky / mimo snímek"); continue; }
    // A hatched strip between solid lines splits the carriageway in two (V 13; ?off=srafy).
    const band = !HATCH.off && w.parts.every((p) => BLOCK.has(p.seg.type)) ? hatchBands(img.st, c.s + 0.4, c.e - 0.4, H).sort((x, y) => y.share * (y.e - y.s) - x.share * (x.e - x.s))[0] : null;
    if (band) {
      const segs = hatched(w, c, band, img.st, H);
      if (segs) { out.push({ w, segs }); changed++; why(c, `změněno, šrafy ${band.s.toFixed(1)}–${band.e.toFixed(1)}, vozovka profilu ${w.s.toFixed(1)}–${w.e.toFixed(1)}: ${w.parts.map((p) => p.seg.type + p.seg.width).join(' ')}`); continue; }
    }
    const found = laneLines(img.st, H, c.s, c.e);
    if (!found.length) { why(c, "žádné čáry"); continue; }
    // Only lanes and shoulders: the lanes as measured on the map's carriageway, what the profile has more or less
    // (its roadway is wider or narrower than the map's) goes to a shoulder. Else the lines are stretched onto the
    // profile and only move its boundaries.
    const k = (w.e - w.s) / (c.e - c.s), toProfile = (g) => w.s + (g - c.s) * k;
    const segs = w.parts.every((p) => BLOCK.has(p.seg.type)) ? measured(w, c, found, found.solid, img.st.fine) : redraw(w, found.map(toProfile), img.st.fine);
    if (segs) { out.push({ w, segs }); changed++; why(c, `změněno, čáry ${found.map((l, i) => `${l.toFixed(2)}${found.solid?.[i] ? "=" : "-"}`).join(" ")}, pravidla ${w.parts.map((p) => p.seg.type + p.seg.width).join(" ")}`); } else why(c, lastWhy || "zamítnuto");
    lastWhy = "";
  }
  // Put the new parts in place of the roadways' old ones (back in screen order).
  for (const { w, segs } of out) {
    const i = result.segments.indexOf(w.parts.at(-1).seg);
    result.segments.splice(i, w.parts.length, ...segs.reverse());
  }
  return changed + bands;
}
// A roadway with a hatched strip [band.s, band.e] (map's t): each side between a kerb and the strip is measured as a
// roadway of its own (the lines in it, the lanes and shoulders by measured()), the strip is a krajnice marked hatched.
// The profile's parts go to the side they lie on; a side that gets none takes a lane of the other, turned round.
function hatched(w, c, band, st, H) {
  const k = (w.e - w.s) / (c.e - c.s), toP = (g) => w.s + (g - c.s) * k, mid = toP((band.s + band.e) / 2);
  const sides = [[c.s, band.s], [band.e, c.e]].map(([s, e], q) => {
    const ws = { s: toP(s), e: toP(e) };
    ws.parts = w.parts.filter((p) => ((p.s + p.e) / 2 < mid) === (q === 0)).map((p) => ({ seg: p.seg, s: Math.max(p.s, ws.s), e: Math.min(p.e, ws.e) })).filter((p) => p.e - p.s > 0.05);
    return { s, e, ws };
  });
  const lane = (q) => sides[1 - q].ws.parts.find((p) => p.seg.type === "pruh")?.seg;
  const done = sides.map(({ s, e, ws }, q) => {
    if (e - s < 2) return null;
    if (!ws.parts.length) { const o = lane(q); ws.parts = [{ seg: { type: "pruh", ...(o?.dir ? { dir: o.dir === "forward" ? "backward" : "forward" } : {}) }, s: ws.s, e: ws.e }]; }
    const lines = laneLines(st, H, s, e);
    const segs = lines.length ? measured(ws, { s, e }, lines, lines.solid, st.fine) : null;
    return segs || sideByWidth(ws, e - s, q);
  });
  if (done.some((x) => !x)) return fail("šrafy: strana nevyšla");
  const hw = (w.e - w.s) - done.flat().reduce((x, g) => x + g.width, 0);
  if (hw < HATCH.wMin - 0.5) return fail("šrafy: pás nevyšel");
  return [...done[0], { type: "krajnice", width: +hw.toFixed(2), source: "ortofoto", hatched: true }, ...done[1]];
}
// A side with no usable lines: lanes of 3.5 m at most 4 m wide, a shoulder at the kerb for the rest from KRAJNICE (1 m).
function sideByWidth(ws, width, q) {
  const n = Math.max(1, Math.round(width / 3.5)), lw = Math.min(width / n, 4), rest = width - n * lw;
  const old = ws.parts.filter((p) => p.seg.type === "pruh").map((p) => p.seg), lanes = Array.from({ length: n }, (_, i) => ({ ...(old[Math.min(old.length - 1, i)] || { type: "pruh" }), type: "pruh", width: +(lw + (rest < 1 ? rest / n : 0)).toFixed(2), source: "ortofoto" }));
  if (rest >= 1) { const sh = { type: "krajnice", width: +rest.toFixed(2), source: "odhad" }; return q === 0 ? [sh, ...lanes] : [...lanes, sh]; }
  return lanes;
}
// A roadway of only lanes and shoulders, laid on the map's carriageway c: pieces between the kerbs and the lines.
function measured(w, c, lines, solid = [], fine = true) {
  const m = { w, c, lines, solid, fine };
  classifyPieces(m);
  splitDoublePieces(m);
  splitWideKerbPieces(m);
  const { pieces, kinds, had } = m;
  if (kinds.includes(null) || pieces.length < 2) return fail(`kus není pruh ani krajnice: ${pieces.map((p, q) => `${p.w.toFixed(2)}${kinds[q] === null ? "!" : ""}`).join(" ")} (pravidla ${had} pruhy)`);
  joinKerbPieces(m);
  const list = pieces.map((p, q) => ({ ...p, kind: kinds[q] })).filter((p) => p.kind !== "join");
  // Everything joined (two pieces, both joined to each other: Banská Bystrica, the A/B test of 16. 11. 2026): nothing to measure.
  if (!list.length) return fail("vše spojené");
  if (list.some((p) => p.kind === "pruh" && p.w > (p.wide ? LANE_MAX + LANE_MIN : LANE_MAX))) return fail("pruh moc široký");
  shouldersAtKerbs(m, list);
  const unfit = fitToProfile(m, list) || checkLanes(m, list);
  if (unfit) return fail(unfit);
  return buildParts(m, list);
}

// The pieces between the kerbs and the lines of a carriageway and what each is (a lane, a shoulder, a paved median, one
// joined to its neighbour, or not known yet: null).
function classifyPieces(m) {
  const { w, c, lines, solid } = m;
  const cuts = [c.s, ...lines, c.e], pieces = cuts.slice(1).map((x, q) => ({ s: cuts[q], e: x, w: x - cuts[q] }));
  // At a kerb a piece under LANE_MIN is a shoulder, but behind a dashed line it belongs to the lane: a lane being
  // added widens there (Jedovnická; Bára).
  const kerbLine = (q) => (q === 0 ? solid[0] : solid[lines.length - 1]);
  const kinds = pieces.map((p, q) => ((q === 0 || q === pieces.length - 1) && (p.w < EDGE_MIN || (p.w < LANE_MIN && kerbLine(q) === false)) ? "join" : (q === 0 || q === pieces.length - 1) && p.w < LANE_MIN ? "krajnice" : p.w >= LANE_MIN && p.w <= LANE_MAX ? "pruh" : null));
  // A lane-wide piece between two solid lines with lanes on both sides is a paved median, not a lane (Brněnská: a
  // crash barrier between edge lines; Bára).
  // Only one such piece, and only where it would be a lane more than the rules had: solid lines between all the
  // lanes (Barrandovský most, 4 lanes each way) are no median (report of 14. 11. 2026).
  const had = w.parts.filter((p) => p.seg.type === "pruh").length;
  const median = [];
  for (let q = 1; q < pieces.length - 1; q++) {
    if (kinds[q] === "pruh" && solid[q - 1] && solid[q] && kinds[q - 1] !== "krajnice" && kinds[q + 1] !== "krajnice") median.push(q);
  }
  if (median.length === 1 && kinds.filter((k) => k === "pruh").length > had) kinds[median[0]] = "stred";
  Object.assign(m, { pieces, kinds, had });
}

// A piece of two lanes whose dashed line was not found (a car on it: Olomoucká) is two lanes, while that does not
// give more lanes than the rules had.
function splitDoublePieces({ pieces, kinds, had }) {
  for (let q = pieces.length - 1; q >= 0; q--) {
    const p = pieces[q];
    if (kinds[q] !== null || p.w < 2 * LANE_MIN || p.w > 2 * LANE_MAX) continue;
    const lanes = kinds.filter((k, i) => k === "pruh" || (k === null && i !== q)).length + 2;
    if (lanes > had) continue;
    const mid = (p.s + p.e) / 2;
    pieces.splice(q, 1, { s: p.s, e: mid, w: mid - p.s }, { s: mid, e: p.e, w: p.e - mid });
    kinds.splice(q, 1, "pruh", "pruh");
  }
}

// A piece at a kerb wider than a lane, where the rules had a shoulder, is a lane and the shoulder behind an edge
// line the detector missed (Kukulova, Čuprova, Plzeňská, Kladská; 15 of 117 marked carriageways were left as the
// rules had them, 16. 11. 2026): the lane as wide as the others found here (else 3.5 m), the shoulder the rest, an
// estimate. A wide lane between two lines was tried too and gave fewer right lane counts.
function splitWideKerbPieces({ w, pieces, kinds, had }) {
  const lanesHere = pieces.filter((p, q) => kinds[q] === "pruh").map((p) => p.w).sort((x, y) => x - y);
  const usual = Math.min(4.25, Math.max(3, lanesHere.length ? lanesHere[lanesHere.length >> 1] : 3.5));
  for (let q = pieces.length - 1; q >= 0; q--) {
    const p = pieces[q], kerb = q === 0 || q === pieces.length - 1;
    if (kinds[q] !== null) continue;
    const ruled = (q === 0 ? w.parts[0] : w.parts.at(-1)).seg.type === "krajnice";
    // ...and only while that gives no more lanes than the rules had (Brno: 4.85 m was a lane too many).
    const lanesThen = kinds.filter((k) => k === "pruh").length + 1;
    if (kerb && ruled && lanesThen <= had && p.w > LANE_MAX && p.w - usual >= 0.5 && p.w - usual <= OUTER_MAX) {
      const lane = { s: q === 0 ? p.e - usual : p.s, e: q === 0 ? p.e : p.s + usual, w: usual };
      const shoulder = { s: q === 0 ? p.s : p.s + usual, e: q === 0 ? p.e - usual : p.e, w: p.w - usual, rules: true };
      pieces.splice(q, 1, ...(q === 0 ? [shoulder, lane] : [lane, shoulder]));
      kinds.splice(q, 1, ...(q === 0 ? ["krajnice", "pruh"] : ["pruh", "krajnice"]));
    }
  }
}

// On ČÚZK's 12.5 cm a line near one kerb only is as often the kerb itself (the map's carriageway a metre off) or
// worn asphalt as an edge line: a shoulder only where both kerbs have one (Hradec; Bára).
// The lane it joins must still look like one (else the rules stay: 324, worn asphalt taken for the centre line).
function joinKerbPieces({ pieces, kinds, fine }) {
  let strict = -1;
  const lineShoulder = (q) => kinds[q] === "krajnice" && !pieces[q].rules; // not one estimated behind a missed line
  if (!fine && lineShoulder(0) !== lineShoulder(kinds.length - 1) && kinds.filter((k) => k === "krajnice").length < 2) {
    const q = lineShoulder(0) ? 0 : kinds.length - 1;
    if (pieces.length > 2) { kinds[q] = "join"; strict = q; }
  }
  if (kinds[0] === "join") { pieces[1].s = pieces[0].s; pieces[1].w = pieces[1].e - pieces[1].s; pieces[1].wide = strict !== 0; }
  if (kinds.at(-1) === "join") { const o = pieces.at(-2); o.e = pieces.at(-1).e; o.w = o.e - o.s; o.wide = strict !== kinds.length - 1; }
}

// A piece at a kerb where the rules had a shoulder, behind a solid line, is the shoulder behind an edge line
// (Rozvadovská spojka: 3 m behind the line; Brněnská; Brno, Hradecká: 3.6 m), behind a dashed line a lane
// (Poděbradská); when that is not known, a shoulder up to SHOULDER_MAX if it would be one lane more than the rules had.
function shouldersAtKerbs({ w, lines, solid, had }, list) {
  for (const side of ["s", "e"]) {
    const ruled = (side === "s" ? w.parts[0] : w.parts.at(-1)).seg.type === "krajnice", end = side === "s" ? list[0] : list.at(-1);
    const line = side === "s" ? lines.indexOf(end.e) : lines.indexOf(end.s);
    const more = list.filter((p) => p.kind === "pruh").length > had;
    // Never the roadway's last lane: of two pieces behind solid lines the first becomes the shoulder and the other stays the lane
    // (Výškovická in Ostrava: a lane and a hatched strip, both made shoulders and the roadway left without a lane;
    // Bára 27. 11. 2026).
    const lastLane = list.filter((p) => p.kind === "pruh").length <= 1;
    if (ruled && end.kind === "pruh" && !lastLane && ((solid[line] === true && end.w <= LANE_MAX) || (solid[line] === undefined && more && end.w <= SHOULDER_MAX))) end.kind = "krajnice";
  }
}

// The profile's roadway against the map's: the difference to the shoulder the rules had on that side (or a new
// one, from 1 m), else to the outer lanes evenly. Returns why it does not fit, or null.
function fitToProfile({ w, c }, list) {
  let delta = (w.e - w.s) - (c.e - c.s);
  const ruleSide = (side) => (side === "s" ? w.parts[0] : w.parts.at(-1)).seg.type === "krajnice";
  const sides = ["s", "e"].filter(ruleSide);
  if (Math.abs(delta) > 0.05) {
    const share = delta / (sides.length || 2);
    for (const side of sides.length ? sides : ["s", "e"]) {
      const end = side === "s" ? list[0] : list.at(-1);
      if (end.kind === "krajnice" || !sides.length || share < 1) end.w += share;
      else if (side === "s") list.unshift({ w: share, kind: "krajnice", rules: true }); else list.push({ w: share, kind: "krajnice", rules: true });
    }
    if (list.some((p) => p.w < EDGE_MIN)) return "rozdíl šířky nevyjde";
  }
  return null;
}

// After that every lane must still look like one, or the rules' profile stays. Returns why not, or null.
function checkLanes({ w, had }, list) {
  if (list.some((p) => p.kind === "pruh" && (p.w < LANE_MIN - 0.2 || p.w > (p.wide ? LANE_MAX + LANE_MIN : LANE_MAX + 0.25)))) return "závěrečná kontrola šířek";
  const lanes = list.filter((p) => p.kind === "pruh");
  // One lane wider than a lane is where the rules had two (a two-way road): the centre line was not found, and the one found
  // (a worn trace, a patch) is no edge line (silnice 230 by Mariánské Lázně: 6.45 m, a line 1.3 m from the kerb made a lane of
  // 4.73 m and a shoulder of 1.7 m). The rules' lanes stay.
  if (had >= 2 && lanes.length < had && lanes.some((p) => p.w > ONE_LANE_MAX)) return "jeden široký pruh, pravidla mají víc";
  return null;
}

// The roadway's parts from the pieces: each lane keeps what the rules' lane under it had (direction, kind).
function buildParts({ w }, list) {
  const oldLanes = w.parts.filter((p) => p.seg.type === "pruh"), lanes = list.filter((p) => p.kind === "pruh");
  let li = 0;
  const segs = list.map((p) => {
    if (p.kind === "krajnice" || p.kind === "stred") return { type: "krajnice", width: +p.w.toFixed(2), source: p.rules ? "odhad" : "ortofoto" };
    const from = oldLanes.length === lanes.length ? oldLanes[li] : oldLanes[Math.min(oldLanes.length - 1, Math.floor((li * oldLanes.length) / lanes.length))];
    li++;
    const seg = { ...(from?.seg || { type: "pruh" }), type: "pruh", width: +p.w.toFixed(2), source: "ortofoto" };
    if (oldLanes.length !== lanes.length) delete seg.turn;
    return seg;
  });
  // Across a paved median the lanes run the way the rules' outer lanes on that side run (the rules may have made
  // the median a lane of its own direction).
  const mid = list.findIndex((p) => p.kind === "stred");
  if (mid >= 0 && oldLanes.length) list.forEach((p, q) => { if (p.kind === "pruh" && segs[q].dir) segs[q].dir = (q < mid ? oldLanes[0] : oldLanes.at(-1)).seg.dir; });
  // The roadway keeps its width to the centimetre (rounding goes to the last part).
  const last = segs.at(-1);
  last.width = +(last.width + (w.e - w.s) - segs.reduce((x, q) => x + q.width, 0)).toFixed(2);
  return segs;
}
// One roadway redrawn by the lines (profile positions), or null when the lines do not fit.
function redraw(w, lines, fine = true) {
  const used = new Set();
  // Boundaries: between two parts of the roadway. One between a lane or shoulder and anything else (parking, bike
  // lane, bus lane…) only moves to a line within SNAP; the lanes and shoulders between them are split by the rest.
  const bounds = w.parts.slice(1).map((p, q) => ({ t: p.s, block: BLOCK.has(p.seg.type) && BLOCK.has(w.parts[q].seg.type) }));
  for (const b of bounds) {
    if (b.block) continue;
    const near = lines.filter((l) => !used.has(l)).reduce((x, l) => (Math.abs(l - b.t) < Math.abs(x - b.t) ? l : x), Infinity);
    if (Math.abs(near - b.t) <= SNAP) { b.t = near; used.add(near); }
  }
  // The blocks of lanes and shoulders, between the kept boundaries.
  const edges = [w.s, ...bounds.filter((b) => !b.block).map((b) => b.t), w.e];
  const groups = [];
  let gi = 0;
  for (let q = 0; q < w.parts.length; q++) {
    if (q > 0 && !bounds[q - 1].block) gi++;
    (groups[gi] ??= []).push(w.parts[q]);
  }
  const segs = [];
  let changed = false;
  for (const [g, list] of groups.entries()) {
    const s = edges[g], e = edges[g + 1];
    const keep = () => list.forEach((p, q) => segs.push({ ...p.seg, width: +((q === list.length - 1 ? e : p.e) - (q === 0 ? s : p.s)).toFixed(2) }));
    if (!list.every((p) => BLOCK.has(p.seg.type))) { keep(); if (Math.abs(s - list[0].s) > 0.01 || Math.abs(e - list.at(-1).e) > 0.01) changed = true; continue; }
    const inside = lines.filter((l) => !used.has(l) && l > s + 0.3 && l < e - 0.3);
    if (!inside.length) { lastWhy ||= "jiné části, čáry jen na hranách"; keep(); continue; }
    const cuts = [s, ...inside, e], pieces = cuts.slice(1).map((x, q) => ({ s: cuts[q], e: x, w: x - cuts[q] }));
    // At a kerb (the roadway's own edge) a piece up to 2.5 m is a shoulder (a sliver under EDGE_MIN joins its neighbour);
    // anything else must be a lane (2.5–4.75 m), or the block stays as the rules drew it.
    const atKerb = (p) => Math.abs(p.s - w.s) < 0.01 || Math.abs(p.e - w.e) < 0.01;
    const kinds = pieces.map((p) => (atKerb(p) && p.w < EDGE_MIN ? "join" : atKerb(p) && p.w < LANE_MIN ? "krajnice" : p.w >= LANE_MIN && p.w <= LANE_MAX ? "pruh" : null));
    if (kinds.includes(null) || pieces.length < 2) { lastWhy ||= "jiné části, kus není pruh"; keep(); continue; }
    // ČÚZK: a shoulder only where both kerbs of the roadway have one (as in measured()).
    if (!fine && pieces.length > 2) {
      const ends = [0, kinds.length - 1].filter((q) => kinds[q] === "krajnice" && atKerb(pieces[q]));
      const kerbs = [0, kinds.length - 1].filter((q) => atKerb(pieces[q]));
      if (ends.length === 1 && kerbs.length === 2) kinds[ends[0]] = "join";
    }
    // A sliver at a kerb (only the first or the last piece can be one) widens its neighbour.
    if (kinds[0] === "join") { pieces[1].s = pieces[0].s; pieces[1].w = pieces[1].e - pieces[1].s; }
    if (kinds.at(-1) === "join") { const o = pieces.at(-2); o.e = pieces.at(-1).e; o.w = o.e - o.s; }
    const keepPieces = pieces.filter((_, q) => kinds[q] !== "join"), keepKinds = kinds.filter((x) => x !== "join");
    if (keepPieces.some((p, q) => keepKinds[q] === "pruh" && p.w > LANE_MAX)) { lastWhy ||= "jiné části, pruh moc široký"; keep(); continue; }
    // The lanes take what the rules' lanes had: in order when there are as many, else from the lane they overlap most.
    const oldLanes = list.filter((p) => p.seg.type === "pruh"), newLanes = keepKinds.filter((x) => x === "pruh").length;
    let li = 0;
    keepPieces.forEach((p, q) => {
      if (keepKinds[q] === "krajnice") { segs.push({ type: "krajnice", width: +p.w.toFixed(2), source: "ortofoto" }); return; }
      const from = oldLanes.length === newLanes ? oldLanes[li] : oldLanes.reduce((b, o) => (Math.min(o.e, p.e) - Math.max(o.s, p.s) > Math.min(b.e, p.e) - Math.max(b.s, p.s) ? o : b), oldLanes[0] || list[0]);
      li++;
      const seg = { ...(from?.seg || { type: "pruh" }), type: "pruh", width: +p.w.toFixed(2), source: "ortofoto" };
      if (oldLanes.length !== newLanes) delete seg.turn; // the arrows belonged to the lanes as the rules drew them
      segs.push(seg);
    });
    changed = true;
  }
  return changed ? segs : null;
}
