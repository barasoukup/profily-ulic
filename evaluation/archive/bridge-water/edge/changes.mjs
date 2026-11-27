// What the change did to the collected cuts (rows of collect.js): unchanged, changed, noise, no profile; the railings.
//   node evaluation/archive/bridge-water/edge/changes.mjs <rows.json> [B A]
import fs from "node:fs";
const [file, V1 = "B", V2 = "A"] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(file, "utf8"));
const differs = (a, b) => a.parts.length !== b.parts.length || a.parts.some(([t, w], i) => t !== b.parts[i][0] || Math.abs(w - b.parts[i][1]) >= 0.2);
const n = { same: 0, changed: 0, noise: 0, none: 0 }, rails = { both: 0, one: 0, none: 0 };
for (const r of rows) {
  const a = r[V1], b = r[V2];
  if (!a?.parts?.length || !b?.parts?.length) { n.none++; continue; }
  const k = (a.rails || []).filter(Boolean).length;
  rails[k === 2 ? "both" : k === 1 ? "one" : "none"]++;
  if (!differs(a, b)) { n.same++; continue; }
  if (r[`${V1}2`]?.parts && differs(a, r[`${V1}2`])) { n.noise++; continue; }
  n.changed++;
  if (process.env.V) console.log(r.id, a.name, "\n  B:", a.parts.map((p) => p.join(" ")).join(" | "), "\n  A:", b.parts.map((p) => p.join(" ")).join(" | "));
}
console.log(JSON.stringify({ rows: rows.length, ...n, rails }));
