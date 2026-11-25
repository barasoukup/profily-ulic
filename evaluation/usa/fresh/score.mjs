// The fresh measurement's score (packages.mjs): the blind A/B (two judges a cut, p<k>-a/-b.jsonl) and the universal
// measurement of 30 cuts (q<k>.jsonl) of the app with DC's map, ?dc=0 and OSM only.   node evaluation/usa/fresh/score.mjs > results/score.md
import fs from "node:fs";
import { compare } from "../../universal/compare.mjs";
const HERE = process.env.EVAL_DIR ? `file://${process.env.EVAL_DIR}/` : import.meta.url, NAME = process.env.EVAL_DATA || "us-fresh", OFF = process.env.EVAL_OFF || "dc0", WHO = process.env.EVAL_WHO || "mapou DC";
const here = (f) => new URL(f, HERE), json = (f) => JSON.parse(fs.readFileSync(here(f), "utf8"));
const lines = (f) => fs.readFileSync(here(f), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
const kind = new Map(json(process.env.EVAL_SAMPLE || "sample.json").map((s) => [s.id, s.kind])), key = json("results/key.json"), KINDS = ["local", "service", "arterial", "collector", "motorway"];
const choose = (n, k) => { let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1); return c; };
const sign = (a, b) => { const n = a + b; let s = 0; for (let i = Math.max(a, b); i <= n; i++) s += choose(n, i); return Math.min(1, (2 * s) / 2 ** n); };
const wilson = (a, n) => { const z = 1.96, p = a / n, d = 1 + z * z / n, m = p + z * z / (2 * n), q = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return `${Math.round(100 * (m - q) / d)}–${Math.round(100 * (m + q) / d)} %`; };
const V = {};
for (const k of Object.keys(key)) V[k] = [];
for (let k = 1; fs.existsSync(here(`results/p${k}-a.jsonl`)); k++) for (const j of ["a", "b"]) for (const r of lines(`results/p${k}-${j}.jsonl`)) { const q = key[`${k}/${r.n}`]; V[`${k}/${r.n}`].push(r.verdict === "X" || r.verdict === "Y" ? q[r.verdict] : r.verdict); }
const tot = { def: 0, [OFF]: 0, stejne: 0, nejde: 0 }, per = {}, out = [];
let agree = 0, bothSides = 0, agreeSides = 0;
for (const [k, v] of Object.entries(V)) {
  if (v.length !== 2) throw new Error(k);
  for (const x of v) tot[x]++;
  if (v[0] === v[1]) agree++;
  if (v.every((x) => x === "def" || x === OFF)) { bothSides++; if (v[0] === v[1]) agreeSides++; }
  const s = v.filter((x) => x === "def").length - v.filter((x) => x === OFF).length;
  const r = v.includes("nejde") && s === 0 ? "nejde" : s > 0 ? "def" : s < 0 ? OFF : "nerozhodne";
  out.push({ id: key[k].id, kind: kind.get(key[k].id), v, r, sure: Math.abs(s) === 2 });
}
const c = (f) => out.filter(f).length;
console.log(`## Slepé A/B: mapa proti ?${OFF}, ${out.length} dvojic\n`);
console.log(`Hlasy dvou posuzovatelů: mapa ${tot.def}, odhad ${tot[OFF]}, stejně ${tot.stejne}, nejde posoudit ${tot.nejde}. Shoda posuzovatelů ${agree}/${out.length}; kde oba vybrali stranu, ${agreeSides}/${bothSides}.\n`);
const row = (n, l) => { const g = (f) => l.filter(f).length, a = g((x) => x.r === "def"), b = g((x) => x.r === OFF); return `| ${n} | ${l.length} | **${a} : ${b}** | ${g((x) => x.r === "nerozhodne")} | ${g((x) => x.r === "nejde")} | ${a + b ? wilson(a, a + b) : ""} | ${a + b ? sign(a, b).toFixed(3) : ""} | ${g((x) => x.r === "def" && x.sure)} : ${g((x) => x.r === OFF && x.sure)} |`; };
console.log("| typ | řezů | mapa : odhad | nerozhodně | nejde posoudit | podíl mapy (95 %) | znaménkový test p | oba posuzovatelé shodně |\n|---|---|---|---|---|---|---|---|\n" + row("všechny", out));
console.log(row("bez obslužných", out.filter((x) => x.kind !== "service")));
for (const k of KINDS) console.log(row(k, out.filter((x) => x.kind === k)));
// ---- the universal measurement
const D = new URL("../../universal/data/", import.meta.url).href, A = { [`s ${WHO}`]: new Map(json(D + `${NAME}.json`).filter((r) => r.variant === "def").map((r) => [r.id, r])), "bez mapy": new Map(json(D + `${NAME}.json`).filter((r) => r.variant === OFF).map((r) => [r.id, r])), "jen OSM": new Map(json(D + `${NAME}-osm.json`).map((r) => [r.id, r])) };
const J = [1, 2, 3].flatMap((k) => lines(`results/q${k}.jsonl`));
const LANE = ["pruh", "bus", "tramvaj"], use = J.filter((j) => j.usable && Object.values(A).every((m) => m.get(j.id)?.parts?.length) && j.parts.some((p) => LANE.includes(String(p[0]).replace("?", ""))));
console.log(`\n## Univerzální měření: ${use.length} z ${J.length} řezů (nepoužité: ${J.filter((j) => !use.includes(j)).map((j) => `${j.id}${j.usable ? "" : " není ulice"}`).join(", ") || "žádný"})\n`);
const pct = (a, n) => `${Math.round((100 * a) / n)} %`, sc = {};
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const boot = (d) => { const b = Array.from({ length: 5000 }, () => d.reduce((a) => a + d[Math.floor(rnd() * d.length)], 0) / d.length).sort((x, y) => x - y); return [b[125], b[4875]].map((x) => Math.round(100 * x)); };
console.log("| profil | řezů | složení stejné | shoda složení (95 %) | pruhy stejně | šířka do 1 / 2 m | nejčastější rozdíly |\n|---|---|---|---|---|---|---|");
for (const [n, m] of Object.entries(A)) {
  const r = use.map((j) => compare(j.parts, m.get(j.id).parts, true, false, { A: j.facadeA === false, B: j.facadeB === false })), e = {}; sc[n] = r;
  for (const x of r) for (const y of x.edits) e[y] = (e[y] || 0) + 1;
  console.log(`| ${n} | ${r.length} | ${pct(r.filter((x) => x.same).length, r.length)} | **${pct(r.reduce((a, x) => a + x.score, 0), r.length)}** (${boot(r.map((x) => x.score)).join("–")}) | ${pct(r.filter((x) => x.lanesA === x.lanesB).length, r.length)} | ${pct(r.filter((x) => Math.abs(x.widthA - x.widthB) <= 1).length, r.length)} / ${pct(r.filter((x) => Math.abs(x.widthA - x.widthB) <= 2).length, r.length)} | ${Object.entries(e).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, q]) => `${k} ${q}×`).join(", ")} |`);
}
for (const o of ["bez mapy", "jen OSM"]) { const d = sc[`s ${WHO}`].map((x, i) => x.score - sc[o][i].score), b = d.filter((x) => x > 1e-9).length, w = d.filter((x) => x < -1e-9).length; console.log(`\nMapa proti ${o}: rozdíl ${Math.round((100 * d.reduce((a, x) => a + x, 0)) / d.length)} bodů (95 % ${boot(d).join(" až ")}), po řezech lépe ${b}, hůř ${w}, stejně ${d.length - b - w} (p = ${sign(b, w).toFixed(3)}).`); }
console.log(`\n| typ | řezů | ${Object.keys(A).join(" | ")} |\n|---|---|---|---|---|`);
for (const k of KINDS) { const i = use.map((j, q) => (kind.get(j.id) === k ? q : -1)).filter((q) => q >= 0); if (i.length) console.log(`| ${k} | ${i.length} | ${Object.values(sc).map((r) => pct(i.reduce((a, q) => a + r[q].score, 0), i.length)).join(" | ")} |`); }
console.log("\n## Po řezech A/B\n\n| řez | typ | posuzovatelé | výsledek |\n|---|---|---|---|");
for (const x of out.sort((a, b) => +a.id.slice(2) - b.id.slice(2))) console.log(`| ${x.id} | ${x.kind} | ${x.v.join(", ")} | ${x.r} |`);
