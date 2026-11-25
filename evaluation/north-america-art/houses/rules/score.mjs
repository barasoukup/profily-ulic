// node score.mjs key.json judge.json before.json after.json
import fs from "node:fs";
const [key, j, b, a] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f)));
const T = { before: {}, after: {} }, W = {};
for (const id of Object.keys(key).sort()) {
  const q = j[id], g = (s) => q[key[id].X === s ? "X" : "Y"], lb = b.find((o) => o.id === id).look, la = a.find((o) => o.id === id).look;
  for (const s of ["before", "after"]) T[s][g(s)] = (T[s][g(s)] || 0) + 1;
  const w = q.better === "X" || q.better === "Y" ? key[id][q.better] : q.better;
  W[w] = (W[w] || 0) + 1;
  console.log(id, lb.padEnd(8), g("before").padEnd(8), la.padEnd(11), g("after").padEnd(8), w.padEnd(8), a.find((o) => o.id === id).found ? "" : "(no OSM house)", q.type);
}
console.log(T, "better:", W);
