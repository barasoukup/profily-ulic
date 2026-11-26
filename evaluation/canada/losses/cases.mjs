// The lost and split pairs of the second review's A/Bs (ddot, gaps, tracks, bays): votes, both profiles, the judges' reasons.
//   node evaluation/canada/losses/cases.mjs [ddot|gaps|tracks|bays]
import fs from "node:fs";
const R = new URL("../review/", import.meta.url).pathname;
const key = JSON.parse(fs.readFileSync(R + "results/key.json", "utf8"));
const rows = JSON.parse(fs.readFileSync(R + "../../universal/data/na-review.json", "utf8"));
const sample = JSON.parse(fs.readFileSync(R + "sample.json", "utf8"));
const lines = (f) => (fs.existsSync(R + f) ? fs.readFileSync(R + f, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l)) : []);
const OFF = { ddot: "ddot0", gaps: "gaps0", tracks: "rt0", bays: "bays0" };
const fmt = (r) => (r ? r.parts.map(([t, w]) => `${t} ${w}`).join(" | ") : "-");
const only = process.argv[2];
for (const k of Object.keys(key)) {
  const [pack, n] = k.split("/"); const g = pack.replace(/-\d+$/, ""); if (!OFF[g]) continue;
  if (only && only !== "all" && g !== only) continue;
  const js = ["a", "b"].map((j) => lines(`results/${pack}-${j}.jsonl`).find((x) => String(x.n) === n));
  const v = js.map((r) => (r.verdict === "X" || r.verdict === "Y" ? (key[k][r.verdict] === "def" ? "def" : "off") : r.verdict));
  const a = v.filter((x) => x === "def").length, b = v.filter((x) => x === "off").length;
  if (!(b > a || (a === b && b > 0))) continue;
  const id = key[k].id, s = sample.find((x) => x.id === id);
  const d = rows.find((r) => r.id === id && r.variant === "def"), o = rows.find((r) => r.id === id && r.variant === OFF[g]);
  console.log(`### ${k} ${id} ${b > a ? "PROHRA" : "SPLIT"} [${v.join(",")}] X=${key[k].X} ${s.kind} ${s.highway} "${s.name}" ${s.lat},${s.lon} b${s.bearing} way${s.wayId}`);
  console.log(`  def: ${fmt(d)}  src=${JSON.stringify(d.sources)} note=${d.note}`);
  console.log(`  off: ${fmt(o)}`);
  js.forEach((r, i) => console.log(`  ${"ab"[i]} ${v[i]} (${r.jistota}): ${r.why}`));
}
