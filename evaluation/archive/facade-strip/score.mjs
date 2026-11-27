// The two blind judgings decoded with the key: per judge N (the change) better / O better / the same / unclear, and
// where both agree.   node evaluation/archive/facade-strip/score.mjs <dir> <name>   (dir/results/klic-<name>.json, posudky-<name>-1|2.json)
import fs from "node:fs";
import path from "node:path";
const [dir, name] = process.argv.slice(2);
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, "results", f), "utf8"));
const key = read(`klic-${name}.json`), J = [1, 2].map((k) => read(`posudky-${name}-${k}.json`));
const as = (n, v) => (v === "X" || v === "Y" ? key[n][v] : v);
const tally = (f) => { const c = {}; for (const n of Object.keys(key)) { const v = f(n); c[v] = (c[v] || 0) + 1; } return c; };
J.forEach((j, i) => console.log(`posuzovatel ${i + 1}:`, JSON.stringify(tally((n) => as(n, j[n]?.v)))));
console.log("shoda obou:", JSON.stringify(tally((n) => { const a = as(n, J[0][n]?.v), b = as(n, J[1][n]?.v); return a === b ? a : "neshoda"; })));
for (const n of Object.keys(key)) { const a = as(n, J[0][n]?.v), b = as(n, J[1][n]?.v); if (a === b && (a === "O" || a === "N")) console.log(` ${n} ${key[n].id} ${a}: ${J[0][n].proc} / ${J[1][n].proc}`); }
