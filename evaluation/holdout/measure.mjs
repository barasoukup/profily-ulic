// The hold-out set measured (Bára 19. 11. 2026, steps 1 and 2 of evaluation/ortofoto/LITERATURA-2.md): runs of the
// replay (evaluation/replay/data/out/<run>) of the same cuts, one with the cities' maps (the truth: the surfaces along
// the cut, MTVU codes) and any number with the estimate (?mapa=0 and switches). Per city and pooled:
//   - composition metre by metre (roadway, parking, sidewalk, green, tram bed, other, unknown; buildings left out),
//     all of it and beyond the kerbs; parking counted as roadway (the maps lack most parking in the roadway),
//   - the street's outer kerbs, signed error per side (+ = drawn inside), within 0.5 / 1 m,
//   - the sidewalk's width per side where the truth ends at a house.
// Two estimate runs: paired per cut, the difference with a 95 % interval from a bootstrap over the cuts (each a
// different street) and the count better / worse.
//   node evaluation/holdout/measure.mjs hold-map hold-est [hold-est-noai …]
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "replay", "data", "out");
const [TRUTH, ...RUNS] = process.argv.slice(2);
const read = (run) => Object.fromEntries(fs.readdirSync(path.join(OUT, run)).filter((f) => /^\d+\.json$/.test(f)).map((f) => [f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(OUT, run, f), "utf8"))]));

const ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "krajnice", "cyklopruh", "ochranny_pruh", "obsluzna", "parkovani"]);
const estKind = (type) => (ROADWAY.has(type) ? "vozovka" : ["chodnik", "chodnik_kola", "stezka_sdilena", "cyklostezka", "nastupiste"].includes(type) ? "chodník"
  : ["zelen", "stromorad", "predzahradka"].includes(type) ? "zeleň" : type === "tramvaj" ? "těleso" : type === "nezname" ? "neurčeno" : type === "budova" ? "budova" : "jiné");
const runKind = (c) => (c === 700 || c === 701 || (c >= 9700 && c < 9800) || c === 704 ? "vozovka" : c === 702 || c === 703 ? "chodník" : c >= 400 && c < 500 ? "zeleň"
  : c === 705 ? "těleso" : c === 601 || c === 600 ? "budova" : "jiné");
const KINDS = ["vozovka", "chodník", "zeleň", "těleso", "jiné", "neurčeno"];

function laid(stav, extent) {
  const out = [];
  let t = extent[1];
  for (const s of stav.segments) { out.push({ type: s.type, s: t - s.width, e: t }); t -= s.width; }
  return out;
}
// Runs of one kind (gaps under 0.5 m bridged), the one at the axis and those within 4 m beyond it (the street).
function envelope(parts, is) {
  const rs = [];
  for (const x of [...parts].sort((a, b) => a.s - b.s)) { if (!is(x)) continue; const l = rs.at(-1); if (l && x.s - l.e < 0.5) l.e = Math.max(l.e, x.e); else rs.push({ s: x.s, e: x.e }); }
  const core = rs.filter((r) => r.e - r.s >= 1 && r.s < 6 && r.e > -6);
  if (!core.length) return null;
  let lo = Math.min(...core.map((r) => r.s)), hi = Math.max(...core.map((r) => r.e));
  for (let grew = true; grew;) { grew = false; for (const r of rs) { if (r.e < lo && lo - r.e <= 4 && r.s < lo) { lo = r.s; grew = true; } if (r.s > hi && r.s - hi <= 4 && r.e > hi) { hi = r.e; grew = true; } } }
  return { lo, hi };
}

// One cut of an estimate against the truth: { comp: {all, ok, out, outOk}, kerbs: [dA, dB], walk: [..] } or null.
function measure(truth, est) {
  const tr = truth.eval?.runs, te = est.eval?.extent;
  if (!tr?.length || truth.eval?.estimate || !est.stav?.segments?.length || !te) return null;
  const c1 = truth.cut, c2 = est.cut;
  if (!c1 || !c2 || Math.abs(c1.lat - c2.lat) > 1e-5 || Math.abs(c1.lon - c2.lon) > 1e-5 || Math.abs(c1.bearing - c2.bearing) > 1) return null;
  const parts = laid(est.stav, te), at = (list, t) => list.find((q) => q.s <= t && t < q.e);
  const tEnv = envelope(tr.map((r) => ({ ...r, k: runKind(r.code) })), (x) => x.k === "vozovka" || x.k === "těleso");
  const eEnv = envelope(parts.map((p) => ({ ...p, k: estKind(p.type) })), (x) => x.k === "vozovka" || x.k === "těleso");
  if (!tEnv) return null;
  const tx = truth.eval.extent || [Math.min(...tr.map((r) => r.s)), Math.max(...tr.map((r) => r.e))];
  const lo = Math.max(te[0], tx[0]), hi = Math.min(te[1], tx[1]), comp = { all: 0, ok: 0, out: 0, outOk: 0, conf: {} };
  for (let t = lo + 0.05; t < hi; t += 0.1) {
    const r = at(tr, t), x = at(parts, t);
    if (!r || !x) continue;
    const tk = runKind(r.code), ek = estKind(x.type);
    if (tk === "budova" || ek === "budova") continue;
    const ok = tk === ek;
    comp.all += 0.1; if (ok) comp.ok += 0.1;
    if (t < tEnv.lo || t > tEnv.hi) { comp.out += 0.1; if (ok) comp.outOk += 0.1; }
    comp.conf[`${tk}>${ek}`] = (comp.conf[`${tk}>${ek}`] || 0) + 0.1;
  }
  const kerbs = eEnv ? [eEnv.lo - tEnv.lo, tEnv.hi - eEnv.hi] : [null, null];
  // The sidewalk per side, where the truth's profile ends at a house (edges of the map's own profile).
  const walk = [];
  const edges = truth.stav?.edges || {};
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const house = side === "A" ? edges.right === "budova" : edges.left === "budova";
    if (!house || !eEnv) continue;
    const tk = sg < 0 ? tEnv.lo : tEnv.hi, ek = sg < 0 ? eEnv.lo : eEnv.hi;
    const w = (list, k, from, kind) => list.filter((q) => kind(q) === "chodník" && (sg < 0 ? q.e <= from + 0.01 : q.s >= from - 0.01)).reduce((a, q) => a + (q.e - q.s), 0);
    walk.push(w(parts, "", ek, (q) => estKind(q.type)) - w(tr, "", tk, (q) => runKind(q.code)));
  }
  return { comp, kerbs, walk };
}

const truth = read(TRUTH), runs = Object.fromEntries(RUNS.map((r) => [r, read(r)]));
const sample = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "sample.json"), "utf8"));
const byId = Object.fromEntries(sample.map((p) => [String(p.id), p]));
// Only cuts every run measured (paired).
const res = {};
for (const run of RUNS) res[run] = {};
for (const id of Object.keys(truth)) {
  const m = RUNS.map((run) => runs[run][id] && measure(truth[id], runs[run][id]));
  if (m.some((x) => !x)) continue;
  RUNS.forEach((run, i) => (res[run][id] = m[i]));
}
const ids = Object.keys(res[RUNS[0]]);
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : "–");
const med = (a) => { const b = a.filter(Number.isFinite).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
function stats(run, list) {
  let all = 0, ok = 0, out = 0, outOk = 0; const k = [], w = [];
  for (const id of list) { const m = res[run][id]; all += m.comp.all; ok += m.comp.ok; out += m.comp.out; outOk += m.comp.outOk; k.push(...m.kerbs.filter((x) => x !== null)); w.push(...m.walk); }
  const ka = k.map(Math.abs), wa = w.map(Math.abs);
  return { n: list.length, comp: all ? ok / all : NaN, out: out ? outOk / out : NaN, k05: ka.filter((x) => x <= 0.5).length / (ka.length || 1), k1: ka.filter((x) => x <= 1).length / (ka.length || 1),
    kIn: k.filter((x) => x > 1).length / (k.length || 1), kOut: k.filter((x) => x < -1).length / (k.length || 1), kMed: med(ka), w1: wa.filter((x) => x <= 1).length / (wa.length || 1), wN: wa.length, wMed: med(wa) };
}
const f = (x) => (Number.isFinite(x) ? `${Math.round(100 * x)} %` : "–");
const towns = [...new Set(ids.map((id) => byId[id]?.town))];
const lines = [`# Kontrolní sada: ${TRUTH} proti ${RUNS.join(", ")} (${new Date().toISOString().slice(0, 10)})`, "",
  "Složení po metrech (stání počítané jako vozovka), za obrubami; vnější obruby ulice (+ = odhad uvnitř); chodník u stran s domem.", ""];
for (const run of RUNS) {
  lines.push(`## ${run}`, "", "| Město | řezů | složení | za obrubami | obruby do 0,5 m | do 1 m | dovnitř > 1 m | ven > 1 m | chodník do 1 m (stran) |", "|---|---|---|---|---|---|---|---|---|");
  for (const t of [...towns, "vše"]) {
    const list = t === "vše" ? ids : ids.filter((id) => byId[id]?.town === t), s = stats(run, list);
    lines.push(`| ${t}${t !== "vše" && byId[list[0]]?.aiTrained ? " (model se tu učil)" : ""} | ${s.n} | ${f(s.comp)} | ${f(s.out)} | ${f(s.k05)} | ${f(s.k1)} | ${f(s.kIn)} | ${f(s.kOut)} | ${f(s.w1)} (${s.wN}) |`);
  }
  lines.push("");
}
// Paired comparison of the later runs with the first, per city group: bootstrap over the cuts.
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const score = (run, list, key) => {
  if (key === "comp") { let a = 0, o = 0; for (const id of list) { a += res[run][id].comp.all; o += res[run][id].comp.ok; } return a ? o / a : 0; }
  if (key === "swf1") { let b = 0, e = 0, t = 0; for (const id of list) for (const [k, v] of Object.entries(res[run][id].comp.conf)) { const [tk, ek] = k.split(">"); if (ek === "chodník") e += v; if (tk === "chodník") t += v; if (tk === "chodník" && ek === "chodník") b += v; } return e + t ? (2 * b) / (e + t) : 0; }
  if (key === "walk") { const w = list.flatMap((id) => res[run][id].walk).map(Math.abs); return w.filter((x) => x <= 1).length / (w.length || 1); }
  const k = list.flatMap((id) => res[run][id].kerbs.filter((x) => x !== null)).map(Math.abs);
  return k.filter((x) => x <= 1).length / (k.length || 1);
};
for (const run of RUNS.slice(1)) {
  lines.push(`## ${run} proti ${RUNS[0]} (párově, 95% interval z bootstrapu přes řezy)`, "", "| Skupina | řezů | složení | obruby do 1 m | chodník do 1 m | chodník po metrech (F1) | řezů lépe / hůř (obruby) |", "|---|---|---|---|---|---|---|");
  const groups = [["vše", ids], ["mimo města, kde se model učil", ids.filter((id) => !byId[id]?.aiTrained)], ...towns.map((t) => [t, ids.filter((id) => byId[id]?.town === t)])];
  for (const [name, list] of groups) {
    if (!list.length) continue;
    const d = (key, l) => score(run, l, key) - score(RUNS[0], l, key);
    const boot = (key) => { const v = []; for (let b = 0; b < 2000; b++) { const l = Array.from(list, () => list[Math.floor(rnd() * list.length)]); v.push(d(key, l)); } v.sort((x, y) => x - y); return [v[50], v[1949]]; };
    const ci = (key) => { const [a, b] = boot(key), x = d(key, list); return `${x >= 0 ? "+" : ""}${Math.round(100 * x)} [${Math.round(100 * a)}, ${Math.round(100 * b)}] p. b.`; };
    let better = 0, worse = 0;
    for (const id of list) { const m = (r) => { const k = res[r][id].kerbs.filter((x) => x !== null).map(Math.abs); return k.length ? k.reduce((p, q) => p + q, 0) / k.length : NaN; }; const a = m(RUNS[0]), b = m(run); if (b < a - 0.1) better++; else if (b > a + 0.1) worse++; }
    lines.push(`| ${name} | ${list.length} | ${ci("comp")} | ${ci("kerb")} | ${ci("walk")} | ${ci("swf1")} | ${better} / ${worse} |`);
  }
  lines.push("");
}
const file = path.join(path.dirname(new URL(import.meta.url).pathname), "vysledky", `${RUNS.join("+")}.md`);
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, lines.join("\n") + "\n");
console.log(lines.join("\n"));
// DUMP=file: per cut and run the kerb errors, the town and the link (for looking at the worst).
if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify(ids.map((id) => ({ id, town: byId[id]?.town, street: byId[id]?.street, highway: byId[id]?.highway,
  cut: truth[id].cut && { lat: truth[id].cut.lat, lon: truth[id].cut.lon, bearing: truth[id].cut.bearing },
  ...Object.fromEntries(RUNS.map((r) => [r, { kerbs: res[r][id].kerbs, walk: res[r][id].walk, comp: +(res[r][id].comp.ok / (res[r][id].comp.all || 1)).toFixed(2) }])) }))));
