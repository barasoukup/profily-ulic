// The cuts of the Czech mapFill A/B (O: mapFill off as before, N: on) that differ, with their parts.
//   node evaluation/mapfill-cz/diff.mjs [rows.json]
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const file = process.argv[2] || path.join(ROOT, "..", "universal", "data", "mfcz-ab.json");
const rows = JSON.parse(await fs.readFile(file, "utf8"));
const parts = (p) => (p?.segments || []).map(([t, w, s]) => `${t} ${w}${s ? ` (${s})` : ""}`).join(" · ");
const kinds = (p) => (p?.segments || []).map(([t, w]) => `${t} ${w}`).join(" · ");
const group = (t) => (t === "praha" ? "praha" : /^(brno|plzen|jihlava)$/.test(t) ? "mesta" : "kraje");
const count = {};
for (const r of rows) {
  const g = group(r.town), c = (count[g] ||= { n: 0, diff: 0, err: 0 });
  c.n++;
  if (r.O?.error || r.N?.error) { c.err++; console.log("CHYBA", r.id, r.O?.error || "", r.N?.error || ""); continue; }
  if (kinds(r.O) === kinds(r.N)) continue;
  c.diff++;
  console.log(`\n${r.id} (${g}) ${r.O.name} [${r.highway}] ${r.O.lat},${r.O.lon} az ${r.O.bearing}\n  O: ${parts(r.O)}\n  N: ${parts(r.N)}`);
}
console.log("\n", JSON.stringify(count));
