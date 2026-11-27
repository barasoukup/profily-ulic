// The test of the instruction of 25. 11. 2026 (BRIEF.md) on the cuts of brief2-select.mjs: the official judgement (o),
// new judges with the old instruction (k: the noise of judging again) and new judges with the new one (n), each against
// the app's current profiles, and how many green strips and parking strips each has. Only cuts usable in all three.
//   node evaluation/universal/brief2-score.mjs > evaluation/universal/results/brief2/skore.md
import fs from "node:fs/promises";
import path from "node:path";
import { compare, asClasses, composition } from "./compare.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(ROOT, "data"), RES = path.join(ROOT, "results");
const app = new Map();
for (const f of (await fs.readdir(DATA)).filter((f) => /^app(-[a-z-]+)?\.json$/.test(f)).sort((a, b) => (a === "app.json" ? -1 : b === "app.json" ? 1 : a.localeCompare(b)))) for (const r of JSON.parse(await fs.readFile(path.join(DATA, f), "utf8"))) app.set(r.id, r);
const read = async (dir, re) => new Map((await Promise.all((await fs.readdir(dir)).filter((f) => re.test(f)).map((f) => fs.readFile(path.join(dir, f), "utf8")))).join("\n").split("\n").filter(Boolean).map((l) => JSON.parse(l)).map((j) => [j.id, j]));
const J = { o: await read(RES, /^u-.*\.jsonl$/), k: await read(path.join(RES, "brief2"), /^kontrola-eu.*\.jsonl$/), n: await read(path.join(RES, "brief2"), /^u-eu-.*\.jsonl$/) };
const sample = JSON.parse(await fs.readFile(path.join(RES, "brief2", "sample.json"), "utf8"));
const LABEL = { o: "oficiální posudky (starý pokyn)", k: "noví posuzovatelé, starý pokyn (kontrola)", n: "noví posuzovatelé, nový pokyn" };
const ROAD = new Set(["pruh", "bus", "tramvaj", "stani", "cyklopruh", "krajnice", "jine"]);
// Green strips between a sidewalk and the roadway or parking (a shoulder may lie between), and parking strips.
export const strips = (c) => c.filter((x, i) => (x === "zelen" || x === "stromy") && ((c[i - 1] === "chodnik" && ROAD.has(c[i + 1])) || (c[i + 1] === "chodnik" && ROAD.has(c[i - 1])))).length;
const seq = (parts, judge) => asClasses(parts, judge).map(([c]) => (c === "stromy" ? "zelen" : c)).filter((c, i, a) => c !== a[i - 1]);
const open = (j) => ({ A: j.facadeA === false, B: j.facadeB === false });
const rows = sample.filter((s) => ["o", "k", "n"].every((v) => J[v].get(s.id)?.usable));
console.error("vynecháno", sample.filter((s) => !rows.includes(s)).map((s) => `${s.id}:${["o", "k", "n"].filter((v) => !J[v].get(s.id)?.usable)}`).join(" "));
const pct = (a, n) => `${Math.round((100 * a) / n)} %`;
const line = (label, list, v) => {
  const r = list.map((s) => compare(J[v].get(s.id).parts, app.get(s.id).parts, true, false, open(J[v].get(s.id)))), n = r.length, e = {};
  for (const x of r) for (const y of x.edits) e[y] = (e[y] || 0) + 1;
  return `| ${label} | ${n} | ${pct(r.filter((x) => x.same).length, n)} | ${pct(r.reduce((a, x) => a + x.score, 0), n)} | ${pct(r.filter((x) => x.lanesA === x.lanesB).length, n)} | ${pct(r.filter((x) => Math.abs(x.widthA - x.widthB) <= 1).length, n)} / ${pct(r.filter((x) => Math.abs(x.widthA - x.widthB) <= 2).length, n)} | ${Object.entries(e).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, c]) => `${k} ${c}×`).join(", ")} |`;
};
const HEAD = "| posudky | řezů | složení stejné | shoda složení | pruhy stejně | šířka do 1 / 2 m | nejčastější rozdíly |\n|---|---|---|---|---|---|---|";
console.log(`## Aplikace proti posudkům\n\n${HEAD}`);
for (const v of ["o", "k", "n"]) console.log(line(LABEL[v], rows, v));
const S = rows.filter((s) => s.strip), R = rows.filter((s) => !s.strip), OP = rows.filter((s) => ["FI", "DK"].includes(s.country)), SO = rows.filter((s) => !["FI", "DK"].includes(s.country));
for (const [t, list] of [["pás zeleně v aplikaci", S], ["bez pásu v aplikaci", R], ["bez FI a DK (oficiální Sonnet)", SO], ["FI a DK (oficiální Opus)", OP]]) for (const v of ["o", "k", "n"]) console.log(line(`${t}: ${v}`, list, v));
console.log("\n## Shoda složení podle států (o → k → n)\n\n| stát | řezů | o | k | n |\n|---|---|---|---|---|");
for (const c of [...new Set(rows.map((s) => s.country))]) { const l = rows.filter((s) => s.country === c); console.log(`| ${c} | ${l.length} | ${["o", "k", "n"].map((v) => pct(l.reduce((a, s) => a + compare(J[v].get(s.id).parts, app.get(s.id).parts, true, false, open(J[v].get(s.id))).score, 0), l.length)).join(" | ")} |`); }
console.log("\n## Posudky mezi sebou (shoda složení, jako compare.mjs s fasádami prvního)\n");
for (const [a, b] of [["o", "k"], ["o", "n"], ["k", "n"]]) console.log(`- ${a} ↔ ${b}: ${pct(rows.reduce((x, s) => x + compare(J[a].get(s.id).parts, J[b].get(s.id).parts, true, true, open(J[a].get(s.id))).score, 0), rows.length)}`);
console.log("\n## Pásy zeleně mezi chodníkem a vozovkou a pruhy stání\n\n| | o | k | n | aplikace |\n|---|---|---|---|---|");
const P = { o: (s) => seq(J.o.get(s.id).parts, true), k: (s) => seq(J.k.get(s.id).parts, true), n: (s) => seq(J.n.get(s.id).parts, true), a: (s) => seq(app.get(s.id).parts) };
const cnt = (f) => ["o", "k", "n", "a"].map((v) => f(v)).join(" | ");
const park = (c) => c.filter((x) => x === "stani").length;
console.log(`| řezů s pásem | ${cnt((v) => rows.filter((s) => strips(P[v](s))).length)} |\n| pásů celkem | ${cnt((v) => rows.reduce((x, s) => x + strips(P[v](s)), 0))} |\n| řezů se stáním | ${cnt((v) => rows.filter((s) => park(P[v](s))).length)} |\n| pruhů stání celkem | ${cnt((v) => rows.reduce((x, s) => x + park(P[v](s)), 0))} |`);
for (const [name, f] of [["pás", strips], ["stání", park]]) for (const [a, b] of [["o", "k"], ["o", "n"], ["k", "n"]]) console.log(`- ${name} ${a} → ${b}: přibylo v ${rows.filter((s) => f(P[b](s)) > f(P[a](s))).length} řezech, ubylo v ${rows.filter((s) => f(P[b](s)) < f(P[a](s))).length}`);
console.log("\n## Po řezech\n\n| řez | o | k | n | aplikace | shoda o/k/n |\n|---|---|---|---|---|---|");
for (const s of rows) console.log(`| ${s.id}${s.strip ? " (pás)" : ""} | ${["o", "k", "n"].map((v) => composition(asClasses(J[v].get(s.id).parts, true)).join(" ")).join(" | ")} | ${composition(asClasses(app.get(s.id).parts)).join(" ")} | ${["o", "k", "n"].map((v) => Math.round(100 * compare(J[v].get(s.id).parts, app.get(s.id).parts, true, false, open(J[v].get(s.id))).score)).join("/")} |`);
