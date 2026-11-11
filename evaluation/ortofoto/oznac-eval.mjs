// The orthophoto against the independent marks by eye (OZNACOVANI.md, labels/oznac-<city>-<who>.json): per marked
// carriageway
//   napojení  the true shift of the map against the image (the marked edges against the map's carriageway edges)
//             and each method's guess: none (0), r0 (run.mjs), r1, r2 (napojeni.mjs), only when sure;
//   čáry      the lines inside the carriageway (≥ 0.7 m from its edges) found by m1, m4, m5 (cary.mjs) on every
//             orthophoto (the marks moved into it by the images' own offset);
//   pruhy     the lanes: the app's split of the carriageway (the profile laid on the map) and the orthophoto's (m5
//             lines, moved by the shift), each against the lanes between the marked edges and lines.
//   CITY=praha node evaluation/ortofoto/oznac-eval.mjs [who …]   → printed, data/<city>/oznac-eval.json
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../pilot/public/dmvs.js";
import { ALL, strip, median, layout, align, markings } from "./run.mjs";
import { brightMap, m4, m5, offset } from "./cary.mjs";
import { r1, r2 } from "./napojeni.mjs";
import { FINEST } from "./oznac.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "praha";
const OUT = path.join(ROOT, "data", CITY);
const AB = path.join(ROOT, "..", CITY, "data", "ab-city-stejne");
const WHO = process.argv.slice(2).length ? process.argv.slice(2) : ["A"];
const FINE = FINEST[CITY] || "cuzk12";
const MATCH = 0.3, EDGE = 0.7, PAD = 3;
const sources = Object.keys(ALL).filter((k) => !ALL[k].cities || ALL[k].cities.includes(CITY));

const index = Object.fromEntries(JSON.parse(await fs.readFile(path.join(OUT, "oznac", "index.json"), "utf8")).map((x) => [x.name, x]));
const marks = {};
for (const w of WHO) {
  try { marks[w] = JSON.parse(await fs.readFile(path.join(ROOT, "labels", `oznac-${CITY}-${w}.json`), "utf8")); } catch {}
}
async function image(n, key, r) {
  const file = path.join(OUT, "img", key, `${n}.png`);
  try { return strip(await decodePng(await fs.readFile(file)), JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox, r.cut, r.a.extent[0] - PAD, r.a.extent[1] + PAD, ALL[key].res); } catch { return null; }
}
const near = (list, t) => (list.length ? Math.min(...list.map((x) => Math.abs(x - t))) : Infinity);
const tally = {};
const add = (k, v) => (tally[k] ??= []).push(v);
const rows = [];

for (const [who, lab] of Object.entries(marks)) for (const [name, m] of Object.entries(lab)) {
  const ix = index[name];
  if (!ix || m.quality === "nonroad") continue;
  const toT = (px) => ix.from + px / ix.pxPerM;
  const r = JSON.parse(await fs.readFile(path.join(AB, `${ix.n}.json`), "utf8"));
  const L = layout(r.a), way = L.ways[ix.way];
  const fine = await image(ix.n, FINE, r);
  if (!fine || !way) continue;
  const edges = (m.edges || []).map(toT), lines = (m.lines || []).map(([px, kind]) => ({ t: toT(px), kind }));
  const row = { who, name, quality: m.quality };
  // ---------- napojení: marked outer edges against the map's carriageway edges ----------
  if (edges.length >= 2) {
    const dTrue = median([edges[0] - way.s, edges.at(-1) - way.e]);
    row.dTrue = +dTrue.toFixed(2);
    row.widthErr = +((edges.at(-1) - edges[0]) - (way.e - way.s)).toFixed(2); // the map's width against the marked
    const a0 = align(fine, L.kerbs), f1 = r1(fine, r.a.runs), f2 = r2(fine, r.a.runs);
    for (const [k, d, sure] of [["0", 0, true], ["r0", a0.shift, a0.fit >= 2], ["r1", f1?.d, f1?.sure], ["r2", f2?.d, f2?.sure], ["r1 nebo 0", f1?.sure ? f1.d : 0, true]]) {
      if (d === undefined) continue;
      add(`napojení ${k}`, { err: Math.abs(d - dTrue), sure });
    }
  }
  // ---------- čáry inside the carriageway, on every orthophoto ----------
  const inside = (t, s, e) => t > s + EDGE && t < e - EDGE;
  const ws = edges.length >= 2 ? edges[0] : way.s, we = edges.length >= 2 ? edges.at(-1) : way.e;
  const truth = lines.filter((l) => inside(l.t, ws, we)).map((l) => l.t);
  row.lines = truth.length;
  for (const k of sources) {
    const x = k === FINE ? fine : await image(ix.n, k, r);
    if (!x) continue;
    const off = k === FINE ? 0 : offset(fine, x).d;
    const H = brightMap(x), s = ws + off, e = we + off;
    const tr = truth.map((t) => t + off);
    for (const [mname, found] of [["m1", markings(x, { s, e }).map((q) => q.t)], ["m4", m4(x, H, s, e).map((q) => q.t)], ["m5", m5(x, H, s, e).map((q) => q.t)]]) {
      const f = found.filter((t) => inside(t, s, e));
      add(`čáry ${k} ${mname}`, { truth: tr.length, hit: tr.filter((t) => near(f, t) <= MATCH).length, found: f.length, ok: f.filter((t) => near(tr, t) <= MATCH).length });
    }
  }
  // ---------- pruhy: boundaries inside the carriageway, app against orthophoto ----------
  if (edges.length >= 2 && m.quality === "ok") {
    const dTrue = row.dTrue;
    // The app: its parts' boundaries inside the carriageway, laid on the map, moved by the true shift (so only
    // the split counts, not where the map lies).
    const app = way.parts.slice(1).map((p) => p.s + dTrue).filter((t) => inside(t, ws, we));
    // The orthophoto: m5 lines on the finest and on ČÚZK 12.5 cm, as they are in the image.
    const H = brightMap(fine);
    const ortho = m5(fine, H, ws, we).map((q) => q.t).filter((t) => inside(t, ws, we));
    const c12 = await image(ix.n, "cuzk12", r), off12 = c12 ? offset(fine, c12).d : 0;
    const ortho12 = c12 && FINE !== "cuzk12" ? m5(c12, brightMap(c12), ws + off12, we + off12).map((q) => q.t - off12).filter((t) => inside(t, ws, we)) : [];
    // Realistic: the app laid by the estimated shift (r1 when sure, else none), and the two together: the
    // orthophoto's lines where it found a chain of lanes, plus the app's boundaries of other parts (parking,
    // bike lanes…) where no line of the orthophoto is within 0.8 m; the app alone where the orthophoto found none.
    const f1 = r1(fine, r.a.runs), dEst = f1?.sure ? f1.d : 0;
    const appEst = way.parts.slice(1).map((p) => p.s + dEst).filter((t) => inside(t, ws, we));
    const LANE = /^(pruh|krajnice)/;
    const keep = way.parts.slice(1).filter((p, q) => !(LANE.test(p.type) && LANE.test(way.parts[q].type))).map((p) => p.s + dEst);
    const merged = (o) => (o.length ? [...o, ...keep.filter((t) => near(o, t) > 0.8)].filter((t) => inside(t, ws, we)) : appEst);
    // Snap: the app's boundaries (its count of lanes) moved to the nearest line of the orthophoto within 1.2 m.
    const snapped = (o) => appEst.map((t) => { const q = o.reduce((b, x) => (Math.abs(x - t) < Math.abs(b - t) ? x : b), Infinity); return Math.abs(q - t) <= 1.2 ? q : t; });
    const sets = [["aplikace (posun ze značek)", app], ["aplikace (posun odhadnutý)", appEst], [`ortofoto ${FINE}`, ortho], [`aplikace + ${FINE}`, merged(ortho)], [`aplikace přichycená k ${FINE}`, snapped(ortho)]];
    if (FINE !== "cuzk12") sets.push(["ortofoto cuzk12", ortho12], ["aplikace + cuzk12", merged(ortho12)], ["aplikace přichycená k cuzk12", snapped(ortho12)]);
    for (const [k, b] of sets) {
      add(`pruhy ${k}`, { lanes: b.length + 1, trueLanes: truth.length + 1, errs: truth.map((t) => near(b, t)), extra: b.filter((t) => near(truth, t) > MATCH).length });
    }
  }
  rows.push(row);
}

// ---------- summary ----------
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : "–");
const med = (v) => { const s = [...v].filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[s.length >> 1] : NaN; };
console.log(`${CITY}: označeno ${rows.length} vozovek (${rows.filter((r) => r.quality === "ok").length} ok)`);
const dt = rows.filter((r) => r.dTrue !== undefined);
console.log(`Skutečný posun mapy proti obrázku (${FINE}): medián |d| ${med(dt.map((r) => Math.abs(r.dTrue))).toFixed(2)} m, do 0,3 m ${dt.filter((r) => Math.abs(r.dTrue) <= 0.3).length}/${dt.length}; šířka vozovky mapy proti obrázku medián ${med(dt.map((r) => Math.abs(r.widthErr))).toFixed(2)} m`);
for (const [k, v] of Object.entries(tally)) {
  if (k.startsWith("napojení")) {
    const sure = v.filter((x) => x.sure);
    console.log(`${k}: všechny chyba medián ${med(v.map((x) => x.err)).toFixed(2)} m, do 0,3 m ${pct(v.filter((x) => x.err <= 0.3).length, v.length)}; jisté ${sure.length}/${v.length}, z nich do 0,3 m ${pct(sure.filter((x) => x.err <= 0.3).length, sure.length)}`);
  } else if (k.startsWith("čáry")) {
    const s = (q) => v.reduce((a, x) => a + x[q], 0);
    console.log(`${k}: recall ${pct(s("hit"), s("truth"))} (${s("hit")}/${s("truth")}), precision ${pct(s("ok"), s("found"))} (${s("ok")}/${s("found")})`);
  } else if (k.startsWith("pruhy")) {
    const errs = v.flatMap((x) => x.errs);
    console.log(`${k}: počet pruhů správně ${pct(v.filter((x) => x.lanes === x.trueLanes).length, v.length)} (${v.length}), dělicí čáry do 0,3 m ${pct(errs.filter((e) => e <= MATCH).length, errs.length)}, nad 1 m ${errs.filter((e) => e > 1).length}, hranic navíc ${v.reduce((a, x) => a + x.extra, 0)}`);
  }
}
await fs.writeFile(path.join(OUT, "oznac-eval.json"), JSON.stringify({ rows, tally }, null, 1));
