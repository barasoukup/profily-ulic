// The control of 26. 11. 2026 (ZPRAVA.md, Kontroly): the default profiles (no switch) of the measurements' cuts of New York
// (../sample.json, 50), San Francisco (../../sf/fresh.json, 60) and Boston (../../boston/fresh.json, 60), collected in the
// app (../../collect.js way, variant def) with the code and with the code without ?outerosm and ?nycsigns (HEAD with
// f34574a, 927fbcb and 71e7026 reverted), must be equal.   node control.mjs <without.json> <with.json> > results/control.txt
import fs from "node:fs";
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
let same = 0;
const diff = [];
for (const r of a) {
  const s = b.find((x) => x.id === r.id);
  if (s && !r.error && !s.error && JSON.stringify(r.parts) === JSON.stringify(s.parts)) same++;
  else diff.push(r.id);
}
const city = (id) => ({ n: "New York", s: "San Francisco", b: "Boston" })[id[0]];
for (const c of ["New York", "San Francisco", "Boston"]) console.log(`${c}: ${a.filter((r) => city(r.id) === c).length - diff.filter((d) => city(d) === c).length} z ${a.filter((r) => city(r.id) === c).length} stejných`);
console.log(`celkem ${same} z ${a.length}${diff.length ? `, jiné: ${diff.join(", ")}` : ""}`);
