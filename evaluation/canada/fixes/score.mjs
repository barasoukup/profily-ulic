// The score of the fixes' A/Bs (packages.mjs here; results/<group>-<k>-a.jsonl and -b.jsonl): the rule against without it, by two
// blind judges a pair. A pair is won by a side with more of the two votes; "both" counts pairs where both judges chose the same
// side; "cannot judge" apart.   node evaluation/canada/fixes/score.mjs > results/score.md
import fs from "node:fs";
import { sign, wilson } from "../review/stat.mjs";
const here = (f) => new URL(f, import.meta.url), key = JSON.parse(fs.readFileSync(here("results/key.json"), "utf8")), report = JSON.parse(fs.readFileSync(here("results/packages.json"), "utf8"));
const lines = (f) => fs.readFileSync(here(f), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
const V = {};
for (const k of Object.keys(key)) {
  const [pack, n] = k.split("/");
  V[k] = ["a", "b"].map((j) => { const r = lines(`results/${pack}-${j}.jsonl`).find((x) => String(x.n) === n); if (!r) throw new Error(`${k} ${j}`); return r.verdict === "X" || r.verdict === "Y" ? (key[k][r.verdict] === "def" ? "def" : "off") : r.verdict; });
}
console.log("# A/B oprav proher (FIXES.md)\n\n| skupina | dvojic | s pravidlem : bez | nerozhodně | nejde posoudit | podíl (95 %) | p | oba shodně | shoda posuzovatelů |\n|---|---|---|---|---|---|---|---|---|");
const row = (name, ks) => {
  const r = ks.map((k) => { const v = V[k], a = v.filter((x) => x === "def").length, b = v.filter((x) => x === "off").length; return { a, b, no: a === b && v.includes("nejde"), tie: a === b && !v.includes("nejde"), same: v[0] === v[1] }; });
  const w = r.filter((x) => x.a > x.b).length, l = r.filter((x) => x.b > x.a).length;
  console.log(`| ${name} | ${ks.length} | **${w} : ${l}** | ${r.filter((x) => x.tie).length} | ${r.filter((x) => x.no).length} | ${wilson(w, w + l)} | ${sign(w, l).toFixed(3)} | ${r.filter((x) => x.a === 2).length} : ${r.filter((x) => x.b === 2).length} | ${r.filter((x) => x.same).length}/${ks.length} |`);
};
const groups = [...new Set(Object.keys(key).map((k) => k.replace(/-\d+\/.*/, "")))];
for (const g of groups) {
  const ks = Object.keys(key).filter((k) => k.startsWith(`${g}-`));
  row(g, ks);
  if (ks.some((k) => key[k].photo !== undefined)) { row(`${g}, s fotkou`, ks.filter((k) => key[k].photo)); row(`${g}, jen ortofoto`, ks.filter((k) => !key[k].photo)); }
  // (The fresh sample's groups, the city and, where the partial runs without one fix tell it, which fix changed the profile.)
  if (g === "all") {
    const city = (x) => (/^b/.test(x) ? "Boston" : /^n/.test(x) ? "New York" : "Toronto");
    for (const c of ["Toronto", "Boston", "New York"]) if (ks.some((k) => city(key[k].group) === c)) row(`${g}, ${c}`, ks.filter((k) => city(key[k].group) === c));
    for (const sg of [...new Set(ks.map((k) => key[k].group))]) row(`${g}, skupina ${sg}`, ks.filter((k) => key[k].group === sg));
    const rows = JSON.parse(fs.readFileSync(here("../../universal/data/na-fixes-plan.json"), "utf8")), rv = (id, v) => rows.find((r) => r.id === id && r.variant === v);
    const differs = (a, b) => a.parts.length !== b.parts.length || a.parts.some(([t, w], i) => t !== b.parts[i][0] || Math.abs(w - b.parts[i][1]) >= 0.2);
    const fix = (id) => { const d = rv(id, "def"), G = rv(id, "gapsfix0"), T = rv(id, "ta0"); if (!G || !T) return "?"; return (differs(d, G) ? "G" : "") + (differs(d, T) ? "T" : "") || "-"; };
    for (const [f, name] of [["G", "mezery mezi vozovkami (gapsortho + gapswide)"], ["T", "osa pod vyříznutou cyklostezkou (trackaxis)"], ["?", "oprava neurčená (běh bez jedné opravy nedoběhl)"]]) { const sel = ks.filter((k) => fix(key[k].id) === f); if (sel.length) row(`${g}, ${name}`, sel); }
  }
  for (const kind of ["local", "service", "collector", "arterial", "motorway"]) if (g === "ddot" && ks.some((k) => key[k].kind === kind)) row(`${g}, ${kind}`, ks.filter((k) => key[k].kind === kind));
}
console.log("\n" + JSON.stringify(report) + "\n\n| dvojice | řez | hlasy |\n|---|---|---|");
for (const k of Object.keys(key)) console.log(`| ${k} | ${key[k].id} | ${V[k].join(", ")} |`);
