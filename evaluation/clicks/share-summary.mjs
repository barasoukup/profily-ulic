// Summary of share.js: each variant's share of the usual surface, better : worse than a base (a difference over 0.03), with the
// 95 % interval of the mean difference (bootstrap).   node evaluation/clicks/share-summary.mjs <file.json> [base=now]
import fs from "node:fs/promises";
const rows = JSON.parse(await fs.readFile(process.argv[2], "utf8")).filter((r) => r.now !== undefined && r.unknown < 0.3), base = process.argv[3] || "now";
const K = Object.keys(rows[0]).filter((k) => !["id", "unknown"].includes(k) && !k.startsWith("c_") && k !== base);
let s = 1; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
for (const city of ["vše", ...new Set(rows.map((r) => r.id.split("-")[0]))]) {
  const R = rows.filter((r) => city === "vše" || r.id.startsWith(city));
  console.log(city, R.length, K.map((k) => {
    const d = R.map((r) => r[k] - r[base]).filter((x) => Number.isFinite(x)), ch = d.filter((x) => Math.abs(x) > 1e-9), m = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
    const bs = Array.from({ length: 1000 }, () => m(d.map(() => d[Math.floor(rnd() * d.length)]))).sort((x, y) => x - y);
    const err = (q) => m(R.map((r) => Math.abs(r[`c_${q}`])));
    return `${k}: ${d.filter((x) => x > 0.03).length}:${d.filter((x) => x < -0.03).length} z ${ch.length}, ${(100 * m(d)).toFixed(1)} b. (${(100 * bs[25]).toFixed(1)}; ${(100 * bs[974]).toFixed(1)}), vozovka ${err(k).toFixed(2)}/${err(base).toFixed(2)}`;
  }).join(" | "));
}
