// The blind A/B of the railway part (Bára 27. 11. 2026): the app with the part (rail-on.json) and without (rail-off.json,
// ?off=railway) against two judges' own profiles (vysledky/rail-j1.jsonl, rail-j2.jsonl; POKYN.md), by the universal
// measure (evaluation/universal/compare.mjs): the composition of the street space (edit distance), lanes, width. Per cut
// the mean of the two judges; a sign test over the cuts that differ.
//   node evaluation/railway/score.mjs [map.json]
import fs from "node:fs";
import path from "node:path";
import { compare } from "../universal/compare.mjs";
const ROOT = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(ROOT, "..", "universal", "data");
const map = JSON.parse(fs.readFileSync(path.join(ROOT, process.argv[2] || "judge/map.json"), "utf8")); // judge id → real id
const load = (f) => new Map(JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8")).map((r) => [r.id, r]));
const on = load("rail-on.json"), off = load("rail-off.json");
const judges = ["j1", "j2"].map((j) => new Map(fs.readFileSync(path.join(ROOT, "vysledky", `rail-${j}.jsonl`), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).map((r) => [r.id, r])));
// P(X >= k) or two-sided p of the sign test with n trials at 1/2.
const choose = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c; };
const signP = (better, worse) => { const n = better + worse; if (!n) return 1; const k = Math.max(better, worse); let p = 0; for (let i = k; i <= n; i++) p += choose(n, i) / 2 ** n; return Math.min(1, 2 * p); };
const rows = [];
for (const [jid, id] of Object.entries(map)) {
  const a = on.get(id), b = off.get(id);
  if (!a?.parts?.length || !b?.parts?.length) continue;
  const per = judges.map((J) => {
    const j = J.get(jid);
    if (!j?.usable || !j.parts?.length) return null;
    const open = { A: j.facadeA === false, B: j.facadeB === false };
    return { on: compare(j.parts, a.parts, true, false, open), off: compare(j.parts, b.parts, true, false, open), rail: j.parts.some((p) => String(p[0]).replace("?", "") === "zeleznice") };
  });
  if (per.every((p) => !p)) continue;
  const used = per.filter(Boolean);
  const mean = (k) => used.reduce((s, p) => s + p[k].score, 0) / used.length;
  rows.push({ jid, id, country: a.country, town: a.town, name: a.name, on: mean("on"), off: mean("off"), per, judgesRail: used.filter((p) => p.rail).length, onRail: a.parts.some((p) => p[0] === "railway"), changed: JSON.stringify(a.parts) !== JSON.stringify(b.parts), parts: a.parts, partsOff: b.parts });
}
const verdict = (d) => (d > 0.005 ? "lépe" : d < -0.005 ? "hůř" : "stejně");
const cnt = (list, f) => ({ better: list.filter((r) => f(r) > 0.005).length, worse: list.filter((r) => f(r) < -0.005).length, same: list.filter((r) => Math.abs(f(r)) <= 0.005).length });
const out = [];
out.push("| řez | stát | ulice | s železnicí | bez | posuzovatelé měli železnici | výsledek |\n|---|---|---|---|---|---|---|");
for (const r of rows) out.push(`| ${r.jid} | ${r.country} ${r.town} | ${r.name} | ${r.on.toFixed(2)} | ${r.off.toFixed(2)} | ${r.judgesRail} z ${r.per.filter(Boolean).length} | ${r.changed ? verdict(r.on - r.off) : "beze změny"} |`);
const all = cnt(rows, (r) => r.on - r.off), ch = rows.filter((r) => r.changed);
out.push("", `Posuzovaných řezů ${rows.length}, aplikace se změnila u ${ch.length}.`);
const c = cnt(ch, (r) => r.on - r.off);
out.push(`Průměr obou posuzovatelů, jen změněné: lépe ${c.better}, hůř ${c.worse}, stejně ${c.same}; p (znaménkový, oboustranný) ${signP(c.better, c.worse).toFixed(4)}.`);
for (const [i, J] of judges.entries()) {
  const ci = cnt(ch.filter((r) => r.per[i]), (r) => r.per[i].on.score - r.per[i].off.score);
  out.push(`Posuzovatel ${i + 1}: lépe ${ci.better}, hůř ${ci.worse}, stejně ${ci.same}; p ${signP(ci.better, ci.worse).toFixed(4)}.`);
}
const m = (xs) => (xs.reduce((a, b) => a + b, 0) / (xs.length || 1)).toFixed(3);
out.push(`Střední shoda složení: s železnicí ${m(rows.map((r) => r.on))}, bez ${m(rows.map((r) => r.off))} (všech ${rows.length}); jen změněné ${m(ch.map((r) => r.on))} proti ${m(ch.map((r) => r.off))}.`);
const wd = (k) => m(rows.map((r) => Math.abs(r.per.filter(Boolean)[0]?.[k].widthA - r.per.filter(Boolean)[0]?.[k].widthB)));
out.push(`Šířka uličního prostoru, střední odchylka od posuzovatele 1 (m): s železnicí ${wd("on")}, bez ${wd("off")}.`);
const withRail = rows.filter((r) => r.judgesRail > 0);
out.push(`Řezů, kde aspoň jeden posuzovatel koleje zapsal: ${withRail.length}; z nich aplikace železnici měla v ${withRail.filter((r) => r.onRail).length}.`);
const falseRail = rows.filter((r) => r.onRail && r.judgesRail === 0);
out.push(`Aplikace nakreslila železnici, ale žádný posuzovatel ji nezapsal: ${falseRail.length}${falseRail.length ? " (" + falseRail.map((r) => r.jid).join(", ") + ")" : ""}.`);
console.log(out.join("\n"));
fs.writeFileSync(path.join(ROOT, "vysledky", "ab-detail.json"), JSON.stringify(rows, null, 1));
