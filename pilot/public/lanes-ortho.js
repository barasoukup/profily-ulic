// Lanes and shoulders from the orthophoto (prototype, Bára 11. 11. 2026; evaluation/ortofoto/ZPRAVA.md, rounds 2–4):
// the road markings along the street split the carriageway, where the rules only divide it evenly. On a click one
// image of the orthophoto around the cut (IPR 10 cm in Prague, else ČÚZK 12.5 cm) is asked in parallel with the
// other sources; once the profile is derived, the lines running along each carriageway of the surface map are
// found and the profile's lanes and estimated shoulders between them are redrawn (source "ortofoto"). The map and
// these orthophotos agree within about 0.2 m, so the image is used as it is, without fitting.
// The detector (evaluation/ortofoto/cary.mjs m4, m5): per pixel "brighter than its row's surroundings", per column
// the share of such pixels along ±20 m in pieces of 5 m (a line repeats, an arrow does not), searched turned and
// bent (one direction and curve per carriageway), narrow peaks; then the lines whose gaps look like lanes, chosen
// together. Anything doubtful leaves the rules' profile as it is.

const R = 6378137, ALONG = 20, TIMEOUT = 4000;
const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
// Each city's best orthophoto (evaluation/ortofoto/ZPRAVA.md): Prague IPR 10 cm (summer 2024), Brno's 2025 (tiles of
// about 10 cm, shifted against ČÚZK by 1.06 m east and 3.09 m north: evaluation/ortofoto/posun.mjs), Plzeň's 2024
// (5 cm, asked at 10 cm, no shift), elsewhere ČÚZK 12.5 cm. shift: where the image shows a point, east and north (m).
const BY_CITY = { praha: "ipr", brno: "brno", plzen: "plzen" };
const SOURCES = {
  brno: { res: 0.1, tiles: "https://gis.brno.cz/ags1/rest/services/OMI/OMI_basemaps_ortofoto_2025_wgs/MapServer/tile", z: 20, shift: [1.06, 3.09] },
  plzen: { res: 0.1, url: (b, w, h) => `https://ags.plzen.eu/arcgis/rest/services/Orto_2024_5cm_RGB_mimoveg/MapServer/export?${new URLSearchParams({ bbox: b.join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: "jpg", f: "image", datumTransformations: "[1623]" })}` },
  ipr: { res: 0.1, url: (b, w, h) => `https://gs-pub.praha.eu/imgs/rest/services/ort/letecke_snimkovani/ImageServer/exportImage?${new URLSearchParams({ bbox: b.join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: "jpg", f: "image" })}` },
  cuzk: { res: 0.125, url: (b, w, h) => `https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer?${new URLSearchParams({ service: "WMS", request: "GetMap", version: "1.3.0", layers: "0", styles: "", crs: "EPSG:3857", bbox: b.join(","), width: w, height: h, format: "image/jpeg" })}` },
};
const median = (a) => { const b = a.filter((v) => !Number.isNaN(v)).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };

// ---------- the image: one request, sampled on the cut's grid (t across, u along) ----------
// t0, t1: the stretch across the cut wanted (m). Returns { source, st } or null (no answer in time, a bad image).
export async function laneImage({ frame, dir, t0, t1, cityId, timeout = TIMEOUT, fetchImpl = fetch }) {
  const key = BY_CITY[cityId] || "cuzk", src = SOURCES[key], normal = [-dir[1], dir[0]];
  const k = Math.cos((frame.toLonLat(0, 0)[1] * Math.PI) / 180);
  // A point on the ground is read where the image shows it: moved by the orthophoto's shift (Web Mercator metres).
  const [sx, sy] = (src.shift || [0, 0]).map((v) => v / k);
  const at = (t, u) => { const [mx, my] = merc(...frame.toLonLat(normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u)); return [mx + sx, my + sy]; };
  const corners = [];
  for (const t of [t0, t1]) for (const u of [-ALONG, ALONG]) corners.push(at(t, u));
  let x0 = Math.min(...corners.map((c) => c[0])), x1 = Math.max(...corners.map((c) => c[0]));
  let y0 = Math.min(...corners.map((c) => c[1])), y1 = Math.max(...corners.map((c) => c[1]));
  const w = Math.round(((x1 - x0) * k) / src.res), h = Math.round(((y1 - y0) * k) / src.res);
  if (w > 2000 || h > 2000) return null;
  try {
    let img;
    if (src.tiles) {
      // XYZ tiles of Web Mercator, glued on a canvas; the bbox becomes the tiles' own.
      const size = (2 * Math.PI * R) / 2 ** src.z;
      const tx0 = Math.floor((x0 + Math.PI * R) / size), tx1 = Math.floor((x1 + Math.PI * R) / size);
      const ty0 = Math.floor((Math.PI * R - y1) / size), ty1 = Math.floor((Math.PI * R - y0) / size);
      if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 30) return null;
      const canvas = new OffscreenCanvas((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256), g = canvas.getContext("2d");
      const signal = AbortSignal.timeout(timeout), jobs = [];
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) jobs.push(fetchImpl(`${src.tiles}/${src.z}/${ty}/${tx}`, { signal }).then(async (r) => { if (r.ok) g.drawImage(await createImageBitmap(await r.blob()), (tx - tx0) * 256, (ty - ty0) * 256); }));
      await Promise.all(jobs);
      img = g.getImageData(0, 0, canvas.width, canvas.height);
      x0 = tx0 * size - Math.PI * R; x1 = (tx1 + 1) * size - Math.PI * R; y1 = Math.PI * R - ty0 * size; y0 = Math.PI * R - (ty1 + 1) * size;
    } else {
      const r = await fetchImpl(src.url([x0, y0, x1, y1], w, h), { signal: AbortSignal.timeout(timeout) });
      if (!r.ok) return null;
      const bmp = await createImageBitmap(await r.blob());
      const canvas = new OffscreenCanvas(bmp.width, bmp.height), g = canvas.getContext("2d");
      g.drawImage(bmp, 0, 0);
      img = g.getImageData(0, 0, bmp.width, bmp.height);
    }
    // Resample on the grid of the cut.
    const res = src.res, nt = Math.round((t1 - t0) / res), nu = Math.round((2 * ALONG) / res), L = new Float32Array(nt * nu);
    for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) {
      const [mx, my] = at(t0 + (i + 0.5) * res, ALONG - (j + 0.5) * res);
      const px = Math.floor(((mx - x0) / (x1 - x0)) * img.width), py = Math.floor(((y1 - my) / (y1 - y0)) * img.height);
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) { L[j * nt + i] = NaN; continue; }
      const o = (py * img.width + px) * 4;
      L[j * nt + i] = 0.299 * img.data[o] + 0.587 * img.data[o + 1] + 0.114 * img.data[o + 2];
    }
    return { source: key, st: { nt, nu, res, t0, L, fine: key !== "cuzk" } };
  } catch {
    return null;
  }
}

// ---------- the lines ----------
const FAINT = 0.55, LONG = 0.3, REL = 0.14, MIN_DL = 10, SHARE = 0.1, MAX_W = 0.6, BLOCKS = 8, MIN_SPREAD = 3, WIDER = 1.5;
const CURVES = [0, 1 / 200, -1 / 200, 1 / 100, -1 / 100, 1 / 50, -1 / 50]; // 1/R: the street may bend (Bára)
// Pixels brighter than the median of their row's surroundings (±0.75 m) by REL of it; the value is by how much
// (paint stands out about twice as much as worn, lighter asphalt).
export function brightMap(st) {
  const { nt, nu, res, L } = st, win = Math.max(2, Math.round(0.75 / res)), H = new Uint8Array(nt * nu), step = Math.max(1, win >> 2);
  for (let j = 0; j < nu; j++) for (let i = win; i < nt - win; i++) {
    const v = L[j * nt + i];
    if (Number.isNaN(v)) continue;
    const around = [];
    for (let d = -win; d <= win; d += step) if (Math.abs(d) > 1) around.push(L[j * nt + i + d]);
    const m = median(around);
    if (v - m > Math.max(MIN_DL, REL * m)) H[j * nt + i] = Math.min(255, Math.round(v - m));
  }
  return H;
}
function shareCurve(st, H, s, e, tan, k) {
  const { nt, nu, res, t0 } = st;
  const i0 = Math.max(0, Math.floor((s - WIDER - t0) / res)), i1 = Math.min(nt - 1, Math.floor((e + WIDER - t0) / res));
  const out = [];
  for (let i = i0; i <= i1; i++) {
    let n = 0, hit = 0, dl = 0;
    const bk = new Array(BLOCKS).fill(0), bn = new Array(BLOCKS).fill(0);
    for (let j = 0; j < nu; j++) {
      const u = ALONG - (j + 0.5) * res, ii = i + Math.round((u * tan + (k * u * u) / 2) / res);
      if (ii < 0 || ii >= nt || Number.isNaN(st.L[j * nt + ii])) continue;
      n++;
      const b = Math.min(BLOCKS - 1, Math.floor((j / nu) * BLOCKS));
      bn[b]++;
      if (H[j * nt + ii]) { hit++; bk[b]++; dl += H[j * nt + ii]; }
    }
    out.push({ t: t0 + (i + 0.5) * res, v: n ? hit / n : 0, dl: hit ? dl / hit : 0, spread: bk.filter((x, q) => bn[q] && x / bn[q] >= 0.1).length });
  }
  return out;
}
function peaks(share, res) {
  const out = [], sep = Math.round(0.3 / res);
  for (let k = 0; k < share.length; k++) {
    const v = share[k].v;
    if (v < SHARE) continue;
    let top = true;
    for (let q = Math.max(0, k - sep); q <= Math.min(share.length - 1, k + sep); q++) if (share[q].v > v || (share[q].v === v && q < k)) { top = false; break; }
    if (!top) continue;
    let a = k, e = k;
    while (a > 0 && share[a - 1].v >= v / 2) a--;
    while (e + 1 < share.length && share[e + 1].v >= v / 2) e++;
    if ((e - a + 1) * res > MAX_W) continue;
    const ring = share.slice(Math.max(0, k - 2 * sep), Math.min(share.length, k + 2 * sep + 1)).map((x) => x.v);
    if (v - Math.min(...ring) < SHARE * 0.8) continue;
    if (Math.max(...share.slice(a, e + 1).map((x) => x.spread)) < MIN_SPREAD) continue;
    out.push({ t: share[k].t, share: v, dl: share[k].dl });
  }
  return out;
}
// The lines of one carriageway [s, e]: one direction and bend for all of them (the sharpest share curve).
function linesOf(st, H, s, e) {
  let best = null;
  for (let deg = -3; deg <= 3 + 1e-9; deg += 0.5) for (const k of CURVES) {
    const sh = shareCurve(st, H, s, e, Math.tan((deg * Math.PI) / 180), k);
    const q = sh.reduce((a, x) => a + x.v * x.v, 0);
    if (!best || q > best.q) best = { q, sh };
  }
  // On a city's orthophoto (10 cm, paint fills its pixels) a line standing out less than FAINT of the carriageway's
  // strongest long line is worn, lighter asphalt between the wheel tracks, not paint (Jateční, Plzeň). On ČÚZK's
  // 12.5 cm a thin edge line looks as faint (Bohumínská), so there it stays.
  const found = best ? peaks(best.sh, st.res) : [];
  if (!st.fine) return found;
  const top = Math.max(0, ...found.filter((m) => m.share >= LONG).map((m) => m.dl));
  return found.filter((m) => m.dl >= FAINT * top);
}
// Of those inside the carriageway, the set whose gaps look like lanes (2.5–4.75 m; at the kerbs 1–7.5 m for a
// shoulder; a gap of two lanes whose line is missing with a small penalty), the most line strength.
const LANE_MIN = 2.5, LANE_MAX = 4.75, OUTER_MIN = 1, OUTER_MAX = 7.5, MISSED = 0.1, EDGE_MIN = 0.1, EDGE_SHARE = 0.5;
export function laneLines(st, H, s, e) {
  const all = linesOf(st, H, s, e), c = all.filter((m) => m.t > s + 0.7 && m.t < e - 0.7), n = c.length;
  const best = new Array(n).fill(-Infinity), prev = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    const first = c[i].t - s;
    if (first >= OUTER_MIN && first <= OUTER_MAX + LANE_MAX) best[i] = c[i].share - (first > OUTER_MAX ? MISSED : 0);
    for (let q = 0; q < i; q++) {
      const g = c[i].t - c[q].t, v = best[q] + c[i].share - (g > LANE_MAX ? MISSED : 0);
      if (g >= LANE_MIN && g <= 2 * LANE_MAX && v > best[i]) { best[i] = v; prev[i] = q; }
    }
  }
  let end = -1, top = 0;
  for (let i = 0; i < n; i++) { const last = e - c[i].t, v = best[i] - (last > OUTER_MAX ? MISSED : 0); if (last >= OUTER_MIN && last <= OUTER_MAX + LANE_MAX && v > top) { top = v; end = i; } }
  const out = [];
  for (let i = end; i >= 0; i = prev[i]) out.unshift(c[i].t);
  // The edge lines close to the kerbs (a narrow shoulder, even 20 cm: Bára): a solid line within EDGE_NEAR of a kerb,
  // a lane's width from the next line.
  if (!out.length) return out;
  const edge = (lo, hi) => all.filter((m) => m.t > lo && m.t < hi && m.share >= EDGE_SHARE).sort((a, b) => b.share - a.share)[0]?.t;
  const a = edge(s + EDGE_MIN, Math.min(s + 1, out[0] - LANE_MIN)), b = edge(Math.max(e - 1, out.at(-1) + LANE_MIN), e - EDGE_MIN);
  if (a !== undefined) out.unshift(a);
  if (b !== undefined) out.push(b);
  return out;
}

// ---------- the profile ----------
const CARRIAGE = (c) => c === 700 || c === 701 || c === 704 || (c >= 9700 && c < 9800);
const RAISED = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "predzahradka", "zelen", "stromorad", "nastupiste", "cyklostezka", "tramvaj", "delici", "plocha", "zahradka", "voda", "zed", "nezname"]);
const BLOCK = new Set(["pruh", "krajnice"]);
const SNAP = 0.6;
const SHOULDER_MAX = 3.6; // a boundary of other parts (parking, bike lane…) moves to a line this near

// result: deriveProfile's { segments, runs, extent }; img: laneImage(). Returns the number of carriageways changed
// (the segments are changed in place).
export function applyLanes(result, img) {
  if (!img || !result?.segments?.length || !result.runs?.length || !result.extent) return 0;
  const H = brightMap(img.st);
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
    if (!c || over(c) < 0.5 * (w.e - w.s) || c.s <= img.st.t0 || c.e >= img.st.t0 + img.st.nt * img.st.res) continue;
    const found = laneLines(img.st, H, c.s, c.e);
    if (!found.length) continue;
    // Only lanes and shoulders: the lanes as measured on the map's carriageway, what the profile has more or less
    // (its roadway is wider or narrower than the map's) goes to a shoulder. Else the lines are stretched onto the
    // profile and only move its boundaries.
    const k = (w.e - w.s) / (c.e - c.s), toProfile = (g) => w.s + (g - c.s) * k;
    const segs = w.parts.every((p) => BLOCK.has(p.seg.type)) ? measured(w, c, found) : redraw(w, found.map(toProfile));
    if (segs) { out.push({ w, segs }); changed++; }
  }
  // Put the new parts in place of the roadways' old ones (back in screen order).
  for (const { w, segs } of out) {
    const i = result.segments.indexOf(w.parts.at(-1).seg);
    result.segments.splice(i, w.parts.length, ...segs.reverse());
  }
  return changed;
}

// A roadway of only lanes and shoulders, laid on the map's carriageway c: pieces between the kerbs and the lines.
function measured(w, c, lines) {
  const cuts = [c.s, ...lines, c.e], pieces = cuts.slice(1).map((x, q) => ({ s: cuts[q], e: x, w: x - cuts[q] }));
  const kinds = pieces.map((p, q) => ((q === 0 || q === pieces.length - 1) && p.w < EDGE_MIN ? "join" : (q === 0 || q === pieces.length - 1) && p.w < LANE_MIN ? "krajnice" : p.w >= LANE_MIN && p.w <= LANE_MAX ? "pruh" : null));
  // A piece of two lanes whose dashed line was not found (a car on it: Olomoucká) is two lanes, while that does not
  // give more lanes than the rules had.
  const had = w.parts.filter((p) => p.seg.type === "pruh").length;
  for (let q = pieces.length - 1; q >= 0; q--) {
    const p = pieces[q];
    if (kinds[q] !== null || p.w < 2 * LANE_MIN || p.w > 2 * LANE_MAX) continue;
    const lanes = kinds.filter((k, i) => k === "pruh" || (k === null && i !== q)).length + 2;
    if (lanes > had) continue;
    const m = (p.s + p.e) / 2;
    pieces.splice(q, 1, { s: p.s, e: m, w: m - p.s }, { s: m, e: p.e, w: p.e - m });
    kinds.splice(q, 1, "pruh", "pruh");
  }
  if (kinds.includes(null) || pieces.length < 2) return null;
  if (kinds[0] === "join") { pieces[1].s = pieces[0].s; pieces[1].w = pieces[1].e - pieces[1].s; }
  if (kinds.at(-1) === "join") { const o = pieces.at(-2); o.e = pieces.at(-1).e; o.w = o.e - o.s; }
  const list = pieces.map((p, q) => ({ ...p, kind: kinds[q] })).filter((p) => p.kind !== "join");
  if (list.some((p) => p.kind === "pruh" && p.w > LANE_MAX)) return null;
  // More lanes than the rules had: a piece at a kerb where the rules had a shoulder, up to SHOULDER_MAX wide, is the
  // shoulder behind an edge line (Rozvadovská spojka: 3 m behind the line), not one more lane.
  for (const side of ["s", "e"]) {
    const ruled = (side === "s" ? w.parts[0] : w.parts.at(-1)).seg.type === "krajnice", end = side === "s" ? list[0] : list.at(-1);
    if (ruled && end.kind === "pruh" && end.w <= SHOULDER_MAX && list.filter((p) => p.kind === "pruh").length > had) end.kind = "krajnice";
  }
  // The profile's roadway against the map's: the difference to the shoulder the rules had on that side (or a new
  // one, from 1 m), else to the outer lanes evenly.
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
    if (list.some((p) => p.w < EDGE_MIN)) return null;
  }
  // After that every lane must still look like one, or the rules' profile stays.
  if (list.some((p) => p.kind === "pruh" && (p.w < LANE_MIN - 0.2 || p.w > LANE_MAX + 0.25))) return null;
  const oldLanes = w.parts.filter((p) => p.seg.type === "pruh"), lanes = list.filter((p) => p.kind === "pruh");
  let li = 0;
  const segs = list.map((p) => {
    if (p.kind === "krajnice") return { type: "krajnice", width: +p.w.toFixed(2), source: p.rules ? "odhad" : "ortofoto" };
    const from = oldLanes.length === lanes.length ? oldLanes[li] : oldLanes[Math.min(oldLanes.length - 1, Math.floor((li * oldLanes.length) / lanes.length))];
    li++;
    const seg = { ...(from?.seg || { type: "pruh" }), type: "pruh", width: +p.w.toFixed(2), source: "ortofoto" };
    if (oldLanes.length !== lanes.length) delete seg.turn;
    return seg;
  });
  // The roadway keeps its width to the centimetre (rounding goes to the last part).
  const last = segs.at(-1);
  last.width = +(last.width + (w.e - w.s) - segs.reduce((x, q) => x + q.width, 0)).toFixed(2);
  return segs;
}

// One roadway redrawn by the lines (profile positions), or null when the lines do not fit.
function redraw(w, lines) {
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
    if (!inside.length) { keep(); continue; }
    const cuts = [s, ...inside, e], pieces = cuts.slice(1).map((x, q) => ({ s: cuts[q], e: x, w: x - cuts[q] }));
    // At a kerb (the roadway's own edge) a piece up to 2.5 m is a shoulder (a sliver under EDGE_MIN joins its neighbour);
    // anything else must be a lane (2.5–4.75 m), or the block stays as the rules drew it.
    const atKerb = (p) => Math.abs(p.s - w.s) < 0.01 || Math.abs(p.e - w.e) < 0.01;
    const kinds = pieces.map((p) => (atKerb(p) && p.w < EDGE_MIN ? "join" : atKerb(p) && p.w < LANE_MIN ? "krajnice" : p.w >= LANE_MIN && p.w <= LANE_MAX ? "pruh" : null));
    if (kinds.includes(null) || pieces.length < 2) { keep(); continue; }
    // A sliver at a kerb (only the first or the last piece can be one) widens its neighbour.
    if (kinds[0] === "join") { pieces[1].s = pieces[0].s; pieces[1].w = pieces[1].e - pieces[1].s; }
    if (kinds.at(-1) === "join") { const o = pieces.at(-2); o.e = pieces.at(-1).e; o.w = o.e - o.s; }
    const keepPieces = pieces.filter((_, q) => kinds[q] !== "join"), keepKinds = kinds.filter((x) => x !== "join");
    if (keepPieces.some((p, q) => keepKinds[q] === "pruh" && p.w > LANE_MAX)) { keep(); continue; }
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
