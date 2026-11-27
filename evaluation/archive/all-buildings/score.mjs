// node score.mjs key.json judge.json vzorek.json…    (per state: the id's letters)
import fs from "node:fs";
const R = (f) => JSON.parse(fs.readFileSync(f)), [kf, jf, ...files] = process.argv.slice(2), key = R(kf), J = R(jf), T = {}, W = {}, K = {};
for (const s of files.flatMap((f) => R(f).rows)) {
  const k = key[s.id], q = J[s.id]; if (!k || !q) continue;
  const c = s.id.replace(/\d+/, ""), g = (a) => q[k.X === a ? "X" : "Y"], w = /^[XY]$/.test(q.better) ? k[q.better] : q.better;
  (W[c] ??= {})[w] = (W[c][w] || 0) + 1; (W.all ??= {})[w] = (W.all[w] || 0) + 1;
  const ch = `${s.before.look}>${s.after.look}`; (K[ch] ??= {})[w] = (K[ch][w] || 0) + 1;
  for (const a of ["before", "after"]) { T[a] ??= {}; T[a][g(a)] = (T[a][g(a)] || 0) + 1; }
  console.log(s.id, ch.padEnd(24), g("before").padEnd(8), g("after").padEnd(8), String(w).padEnd(8), s.before.info.levels ? "n" : "-", s.after.info.type || "-", `| ${q.type}`);
}
console.log(T); console.log("better:", W); console.log(K);
