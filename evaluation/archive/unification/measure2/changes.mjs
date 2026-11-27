// The fresh sample: which cuts differ between two arms (a real change: other parts, or a part by 0.25 m and more), per state.
//   node changes.mjs [N L]   ids: node changes.mjs N L ids > results/ids.json
import fs from "node:fs";
const [A = "N", B = "L", ids] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(new URL("results/nove.json", import.meta.url)));
export const key = (c) => (c?.segments || []).map(([t, w]) => `${t} ${w}`).join(" · ");
export const real = (a, b) => a.segments.length !== b.segments.length || a.segments.some(([t, w], i) => t !== b.segments[i][0] || Math.abs(w - b.segments[i][1]) >= 0.25 - 1e-9);
const ok = rows.filter((r) => r[A]?.segments?.length && r[B]?.segments?.length);
const bad = (r) => [r[A], r[B]].some((c) => /Ortofoto teď neodpov/.test(c.status || ""));
if (ids) console.log(JSON.stringify(ok.filter((r) => real(r[A], r[B]) && !bad(r)).map((r) => ({ id: r.id, P: A, Q: B }))));
else {
  const G = {};
  for (const r of ok) { const g = (G[r.country] ||= { cuts: 0, noOrtho: 0, diff: 0, real: 0 }); g.cuts++; if (bad(r)) { g.noOrtho++; continue; } if (key(r[A]) !== key(r[B])) g.diff++; if (real(r[A], r[B])) g.real++; }
  console.table(G);
  console.log(rows.length - ok.length, "chyb;", Object.values(G).reduce((a, g) => a + g.real, 0), "změn");
}
