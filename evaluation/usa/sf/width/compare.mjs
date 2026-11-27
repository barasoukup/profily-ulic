// San Francisco's widths against an independent source (REPORT.md here, 26. 11. 2026).
// 1. Sidewalks: the app's sidewalk side of each end (from the end to the first part of the roadway: sidewalk, tree strip,
//    green) with the map (def) and without it (sf0), and the judges' of the universal measurement (../results/q*.jsonl),
//    against DataSF Sidewalk Widths (4g86-grxu, AECOM 2014, PDDL; the whole set, ../data/width-cache/sidewalk-widths-all.json):
//    the centreline segment within 20 m of the cut, parallel to it (within 20°), of the cut's street when the names agree;
//    sidewalk_f in feet (> 0; negative = varies, 0 = unknown: left out); side "Both" for both ends, N/S/E/W for the end
//    that lies on that side.
// 2. The whole street: with the map, the roadway between SFMTA's kerbs + AECOM's sidewalks against the app's total and the
//    judges' total (the judges see Esri's imagery).
// 3. The shift of the building footprints (ynuv-fyni, 2010) against the right of way (h8n7-e4ns, 2014): along each cut and
//    lines 6 and 12 m up and down the street, the signed gap from the right of way's edge to the first footprint beyond it
//    (negative: the footprint reaches into the right of way), where a footprint lies within 4 m of the edge; a gap is
//    g0 − s·n (n the outward normal of the side, s the shift), s by least squares over all sides; and by the direction of
//    the street.
//   node evaluation/usa/sf/width/compare.mjs > results.md
import fs from "node:fs";
import path from "node:path";
import { cached, rowUrl, bldgUrl } from "./fetch.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname), J = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f), "utf8"));
const FT = 0.3048;
const pts = [...J("../fresh.json").map((p) => ({ ...p, set: "měření SF" })), ...J("../fixes/sample.json").map((p) => ({ ...p, set: "opravy SF" })), ...J("new.json").map((p) => ({ ...p, set: "nové" }))];
const rows = new Map(JSON.parse(fs.readFileSync(process.env.ROWS || path.join(HERE, "../../../universal/data/m1126-sf.json"), "utf8")).map((r) => [r.id, r]));
const judges = new Map(fs.readdirSync(path.join(HERE, "../results")).filter((f) => /^q\d+\.jsonl$/.test(f)).flatMap((f) => fs.readFileSync(path.join(HERE, "../results", f), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))).filter((j) => j.usable !== false).map((j) => [j.id, j]));
const AECOM = J("../data/width-cache/sidewalk-widths-all.json");
const ROAD = new Set(["pruh", "krajnice", "parkovani", "stani", "cyklopruh", "bus", "tramvaj", "tramvaj_v_pruhu", "tramvaj_pruh", "obsluzna", "pruh_piktokoridor", "ochranny_pruh", "bus_cyklo", "delici"]);
const SIDE = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "stromorad", "zelen", "predzahradka"]);
// The sidewalk side of an end: the parts from the end inward while they are sidewalk, tree strip or green; null when the
// end does not start with them (a building's yard, nothing known), 0 when the roadway comes first.
const sideWidth = (parts, fromEnd) => { const p = fromEnd ? [...parts].reverse() : parts; let w = 0; for (const [t, x] of p) { if (SIDE.has(String(t).replace("?", ""))) { w += x; continue; } if (ROAD.has(String(t).replace("?", ""))) return w; return w || null; } return null; };
const roadway = (parts) => { let s = 0; for (const [t, x] of parts) if (ROAD.has(String(t).replace("?", "")) && t !== "delici") s += x; return s; };
const total = (parts) => parts.reduce((s, x) => s + x[1], 0);
const frame = (lat, lon) => { const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574; return { xy: ([x, y]) => [(x - lon) * kx, (y - lat) * ky] }; };
const segDist = (p, a, b) => { const d = [b[0] - a[0], b[1] - a[1]], L = d[0] ** 2 + d[1] ** 2, u = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / L)) : 0; return Math.hypot(a[0] + u * d[0] - p[0], a[1] + u * d[1] - p[1]); };
const norm = (s) => String(s || "").toUpperCase().replace(/\b(STREET|AVENUE|BOULEVARD|DRIVE|WAY|PLACE|COURT|LANE|ROAD|TERRACE|ALLEY|ST|AVE|BLVD|DR|PL|CT|LN|RD|TER)\b\.?/g, "").replace(/[^A-Z0-9]/g, "");
function aecomAt(p) {
  const f = frame(p.lat, p.lon), b = (p.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)];
  let best = null;
  for (const r of AECOM) {
    const c = r.shape?.coordinates;
    if (!c || Math.abs(c[0][1] - p.lat) > 0.003 || Math.abs(c[0][0] - p.lon) > 0.004) continue;
    const g = c.map(f.xy);
    for (let i = 1; i < g.length; i++) {
      const d = segDist([0, 0], g[i - 1], g[i]), v = [g[i][0] - g[i - 1][0], g[i][1] - g[i - 1][1]], L = Math.hypot(...v);
      if (d > 20 || !L || Math.abs((v[0] * dir[0] + v[1] * dir[1]) / L) < Math.cos((20 * Math.PI) / 180)) continue;
      const score = d + (norm(r.street) && norm(r.street) === norm(p.name) ? 0 : 15);
      if (!best || score < best.score) best = { r, d, score, nameOk: norm(r.street) === norm(p.name) };
    }
  }
  return best;
}
// The AECOM width of the end A (left of the bearing) and B: "Both", or the end whose outward direction is that compass side.
function aecomSides(p, a) {
  const w = Number(a.r.sidewalk_f);
  if (!(w > 0)) return null;
  const side = String(a.r.side || "").toUpperCase();
  if (side === "BOTH") return { A: w * FT, B: w * FT };
  const b = (p.bearing * Math.PI) / 180, outA = [-Math.cos(b), Math.sin(b)]; // A lies left of the direction
  const C = { N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0], NE: [0.71, 0.71], NW: [-0.71, 0.71], SE: [0.71, -0.71], SW: [-0.71, -0.71] }[side];
  if (!C) return null;
  return outA[0] * C[0] + outA[1] * C[1] > 0 ? { A: w * FT, B: null } : { A: null, B: w * FT };
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN; };
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace(".", ",").replace("-", "−") : "–");
const pct = (a, n) => (n ? `${Math.round((100 * a) / n)} %` : "–");
// ---- 1. sidewalks
const S = [];
let matched = 0, unmatched = [];
for (const p of pts) {
  const r = rows.get(p.id), a = aecomAt(p);
  if (!a) { unmatched.push(p.id); continue; }
  const aw = aecomSides(p, a);
  if (!aw) { unmatched.push(`${p.id} (${a.r.sidewalk_f})`); continue; }
  matched++;
  for (const end of ["A", "B"]) {
    if (aw[end] == null) continue;
    const fromEnd = end === "B", j = judges.get(p.id);
    S.push({ id: p.id, set: p.set, end, truth: aw[end], nameOk: a.nameOk, def: r?.def?.parts?.length ? sideWidth(r.def.parts, fromEnd) : null, sf0: r?.sf0?.parts?.length ? sideWidth(r.sf0.parts, fromEnd) : null,
      judge: j ? sideWidth(j.parts, fromEnd) : null, map: !!r?.def?.sources?.cityMap });
  }
}
console.log(`# Šířky San Franciska proti DataSF Sidewalk Widths (${new Date().toISOString().slice(0, 10)})\n`);
console.log(`Řezů ${pts.length} (měření SF ${pts.filter((p) => p.set === "měření SF").length}, opravy SF ${pts.filter((p) => p.set === "opravy SF").length}, nové ${pts.filter((p) => p.set === "nové").length}); úsek AECOM se šířkou našel ${matched}, nenašel ${unmatched.length}: ${unmatched.join(", ")}.\n`);
console.log("## 1. Strana chodníku (chodník + stromořadí + zeleň od kraje po vozovku) proti AECOM\n");
console.log("| kdo | řez | stran | medián chyby (kdo − AECOM) | medián abs. chyby | do 0,5 m | do 1 m |\n|---|---|---|---|---|---|---|");
const line = (who, set, l) => { const e = l.map((x) => x.v - x.truth); console.log(`| ${who} | ${set} | ${l.length} | ${f1(med(e))} | ${f1(med(e.map(Math.abs)))} | ${pct(e.filter((x) => Math.abs(x) <= 0.5).length, e.length)} | ${pct(e.filter((x) => Math.abs(x) <= 1).length, e.length)} |`); };
for (const [who, k] of [["aplikace s mapou", "def"], ["aplikace bez mapy (?sf=0)", "sf0"], ["posuzovatelé (Esri)", "judge"]]) {
  for (const [set, flt] of [["všechny", () => true], ["kde se mapa použila", (x) => x.map], ["měření SF", (x) => x.set === "měření SF"], ["nové", (x) => x.set === "nové"]]) {
    const l = S.filter(flt).filter((x) => x[k] != null).map((x) => ({ ...x, v: x[k] }));
    if (l.length) line(who, set, l);
  }
}
// The same sides for all three (the judged cuts): who is closer.
const tri = S.filter((x) => x.def != null && x.judge != null && x.map);
if (tri.length) {
  const c = tri.filter((x) => Math.abs(x.def - x.truth) < Math.abs(x.judge - x.truth) - 0.25).length, d = tri.filter((x) => Math.abs(x.judge - x.truth) < Math.abs(x.def - x.truth) - 0.25).length;
  console.log(`\nNa ${tri.length} stranách, kde je mapa i posuzovatel: blíž AECOM mapa ${c}×, posuzovatel ${d}×, stejně (do 0,25 m) ${tri.length - c - d}×.`);
}
// ---- 2. the whole street
console.log("\n## 2. Celá ulice: vozovka mezi obrubami SFMTA + chodníky AECOM\n");
const W = [];
for (const p of pts) {
  const r = rows.get(p.id), a = aecomAt(p), aw = a && aecomSides(p, a);
  if (!r?.def?.parts?.length || !r.def.sources?.cityMap || !aw || aw.A == null || aw.B == null) continue;
  const sA = sideWidth(r.def.parts, false), sB = sideWidth(r.def.parts, true);
  if (sA == null || sB == null) continue;
  const mid = total(r.def.parts) - sA - sB, implied = mid + aw.A + aw.B, j = judges.get(p.id);
  W.push({ id: p.id, set: p.set, app: total(r.def.parts), implied, sf0: r.sf0?.parts?.length ? total(r.sf0.parts) : null, judge: j ? total(j.parts) : null, appRoad: roadway(r.def.parts), judgeRoad: j ? roadway(j.parts) : null, open: j && (!j.facadeA || !j.facadeB) });
}
console.log("| porovnání | řezů | medián rozdílu | do 1 m | do 2 m |\n|---|---|---|---|---|");
const cmp = (n, l, a, b) => { const e = l.filter((x) => x[a] != null && x[b] != null).map((x) => x[a] - x[b]); if (e.length) console.log(`| ${n} | ${e.length} | ${f1(med(e))} | ${pct(e.filter((x) => Math.abs(x) <= 1).length, e.length)} | ${pct(e.filter((x) => Math.abs(x) <= 2).length, e.length)} |`); };
cmp("aplikace s mapou − (obruby + AECOM)", W, "app", "implied");
cmp("posuzovatelé − (obruby + AECOM)", W, "judge", "implied");
cmp("posuzovatelé − (obruby + AECOM), oba konce u fasády", W.filter((x) => !x.open), "judge", "implied");
cmp("bez mapy − (obruby + AECOM)", W, "sf0", "implied");
cmp("vozovka: posuzovatelé − aplikace s mapou", W, "judgeRoad", "appRoad");
console.log("\n| řez | sada | s mapou | obruby + AECOM | bez mapy | posuzovatelé | vozovka app / posuz. |\n|---|---|---|---|---|---|---|");
for (const x of W) console.log(`| ${x.id} | ${x.set} | ${f1(x.app)} | ${f1(x.implied)} | ${f1(x.sf0)} | ${f1(x.judge)} | ${f1(x.appRoad)} / ${f1(x.judgeRoad)} |`);
// ---- 3. the footprints' shift
console.log("\n## 3. Posun obrysů budov proti uličnímu prostoru\n");
const G = [];
for (const p of pts) {
  let row, bl;
  try { row = await cached(rowUrl(p)); bl = await cached(bldgUrl(p)); } catch { continue; }
  const f = frame(p.lat, p.lon), b = (p.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)], n = [-dir[1], dir[0]];
  const rings = (j) => (j.features || []).flatMap((ft) => (ft.geometry?.type === "MultiPolygon" ? ft.geometry.coordinates.flat() : ft.geometry?.type === "Polygon" ? ft.geometry.coordinates : []).map((r) => r.map(f.xy)));
  const R = rings(row), B = rings(bl);
  for (const off of [0, -6, 6, -12, 12]) {
    const o = [dir[0] * off, dir[1] * off];
    const cross = (rs) => { const t = []; for (const r of rs) for (let i = 1; i < r.length; i++) { const a = [r[i - 1][0] - o[0], r[i - 1][1] - o[1]], c = [r[i][0] - o[0], r[i][1] - o[1]]; const ua = a[0] * dir[0] + a[1] * dir[1], uc = c[0] * dir[0] + c[1] * dir[1]; if (ua === uc || (ua > 0) === (uc > 0)) continue; const u = ua / (ua - uc); t.push((a[0] + u * (c[0] - a[0])) * n[0] + (a[1] + u * (c[1] - a[1])) * n[1]); } return t.sort((x, y) => x - y); };
    const tr = cross(R), tb = cross(B);
    const inside = tr.filter((t) => t < 0).length % 2 === 1;
    if (!inside) continue;
    for (const s of [1, -1]) {
      const edge = s > 0 ? tr.find((t) => t > 0) : [...tr].reverse().find((t) => t < 0);
      if (edge == null || Math.abs(edge) > 40) continue;
      const fac = tb.filter((t) => s * (t - edge) > -4).sort((x, y) => s * (x - y))[0];
      if (fac == null || s * (fac - edge) > 4) continue;
      const out = [n[0] * s, n[1] * s];
      G.push({ id: p.id, gap: s * (fac - edge), nx: out[0], ny: out[1], bearing: ((p.bearing % 180) + 180) % 180 });
    }
  }
}
// Least squares gap = g0 − sx·nx − sy·ny.
function fit(l) {
  const X = l.map((g) => [1, -g.nx, -g.ny]), y = l.map((g) => g.gap), A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v = [0, 0, 0];
  X.forEach((x, k) => { for (let i = 0; i < 3; i++) { v[i] += x[i] * y[k]; for (let j = 0; j < 3; j++) A[i][j] += x[i] * x[j]; } });
  const det = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const D = det(A);
  return [0, 1, 2].map((c) => det(A.map((r, i) => r.map((x, j) => (j === c ? v[i] : x)))) / D);
}
const [g0, sx, sy] = fit(G);
// Bootstrap by cut.
const ids = [...new Set(G.map((g) => g.id))];
let seed = 11;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const bs = [];
for (let k = 0; k < 1000; k++) { const pick = ids.map(() => ids[Math.floor(rnd() * ids.length)]); const l = pick.flatMap((id) => G.filter((g) => g.id === id)); const r = fit(l); if (r.every(Number.isFinite)) bs.push(r); }
const ci = (i) => { const s = bs.map((r) => r[i]).sort((a, b) => a - b); return `${f1(s[Math.floor(0.025 * s.length)])} až ${f1(s[Math.floor(0.975 * s.length)])}`; };
console.log(`Mezer ${G.length} (u ${ids.length} řezů, řez a čáry 6 a 12 m vedle, fasáda do 4 m od okraje uličního prostoru). Model mezera = g0 − posun·n:`);
console.log(`- g0 (průměrná mezera bez posunu) ${f1(g0)} m (95 % ${ci(0)}), posun na východ ${f1(sx)} m (${ci(1)}), na sever ${f1(sy)} m (${ci(2)}): celkem ${f1(Math.hypot(sx, sy))} m směrem ${Math.round(((Math.atan2(sx, sy) * 180) / Math.PI + 360) % 360)}°.\n`);
console.log("| směr ulice | stran | medián mezery na straně k východu/severu | na straně k západu/jihu | polovina rozdílu (posun napříč ulicí) |\n|---|---|---|---|---|");
for (const [name, lo, hi] of [["sever–jih (0–20°, 160–180°)", 160, 20], ["SoMa a šikmé (20–70°, 110–160°)", 20, 70], ["východ–západ (70–110°)", 70, 110]]) {
  const inBin = (b) => (lo > hi ? b >= lo || b < hi : (b >= lo && b < hi) || (lo === 20 && b >= 110 && b < 160));
  const l = G.filter((g) => inBin(g.bearing));
  const pos = l.filter((g) => g.nx + g.ny > 0).map((g) => g.gap), neg = l.filter((g) => g.nx + g.ny <= 0).map((g) => g.gap);
  console.log(`| ${name} | ${l.length} | ${f1(med(pos))} (${pos.length}) | ${f1(med(neg))} (${neg.length}) | ${f1((med(neg) - med(pos)) / 2)} |`);
}
console.log("\n## Strany chodníků po řezech\n\n| řez | sada | konec | AECOM | s mapou | bez mapy | posuzovatel | jméno sedí |\n|---|---|---|---|---|---|---|---|");
for (const x of S) console.log(`| ${x.id} | ${x.set} | ${x.end} | ${f1(x.truth)} | ${f1(x.def)} | ${f1(x.sf0)} | ${f1(x.judge)} | ${x.nameOk ? "ano" : "ne"} |`);
