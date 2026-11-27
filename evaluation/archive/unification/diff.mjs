// The cuts of an A/B of the unification whose parts differ between two variants (types and widths), by group.
//   node evaluation/archive/unification/diff.mjs results/<name>.json [O] [N]
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const [file, P = "O", Q = "N"] = process.argv.slice(2);
const rows = JSON.parse(await fs.readFile(path.join(ROOT, file), "utf8"));
const parts = (p) => (p?.segments || []).map(([t, w, s]) => `${t} ${w}${s ? ` (${s})` : ""}`).join(" · ");
const kinds = (p) => (p?.segments || []).map(([t, w]) => `${t} ${w}`).join(" · ");
const count = {};
for (const r of rows) {
  const g = r.place || r[P]?.city, c = (count[g] ||= { n: 0, diff: 0, err: 0 });
  c.n++;
  if (r[P]?.error || r[Q]?.error) { c.err++; console.log("CHYBA", r.id, r[P]?.error || "", r[Q]?.error || ""); continue; }
  if (kinds(r[P]) === kinds(r[Q])) continue;
  c.diff++;
  console.log(`\n${r.id} (${g}) ${r[P].name} [${r.highway}] ${r[P].lat},${r[P].lon} az ${r[P].bearing?.toFixed(0)}\n  ${P}: ${parts(r[P])}\n  ${Q}: ${parts(r[Q])}`);
}
const tot = Object.values(count).reduce((a, c) => ({ n: a.n + c.n, diff: a.diff + c.diff, err: a.err + c.err }), { n: 0, diff: 0, err: 0 });
console.log("\n", JSON.stringify(count), "\n", JSON.stringify(tot));
