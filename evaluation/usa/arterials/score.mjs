// The verdicts against the keys:   node evaluation/usa/arterials/score.mjs tm tn
import fs from "node:fs";
const D = new URL("./results/", import.meta.url).pathname;
for (const name of process.argv.slice(2)) {
  const key = JSON.parse(fs.readFileSync(`${D}klic-${name}.json`)), c = {};
  for (const f of fs.readdirSync(D).filter((f) => f.startsWith(`posudky-${name}-`)).sort()) for (const l of fs.readFileSync(D + f, "utf8").split("\n").filter(Boolean)) {
    const j = JSON.parse(l), k = key[`${f.slice(8, -6)}/${j.n}`], v = k[j.verdict] || j.verdict;
    c[v] = (c[v] || 0) + 1;
    console.log(name, k.id.padEnd(7), v.padEnd(7), j.jistota, j.why);
  }
  console.log(name, JSON.stringify(c), "\n");
}
