// The cuts where two variants (P, Q) differ beyond noise, one file for baliky.mjs: node vyber.mjs <P> <Q> <out> <files…>
// Noise: a variant's own repetition (F2, L2) differing. F: no law, L: the law as before, N: the law after the lanes.
import fs from "node:fs";
const [P, Q, out, ...files] = process.argv.slice(2);
const ks = (v) => (v?.segments || []).map((s) => `${s[0]} ${s[1]}`).join(" · ");
const rows = files.flatMap((f) => JSON.parse(fs.readFileSync(f, "utf8")).map((r) => ({ ...r, file: f.match(/s[trq]-(\w+)/)?.[1] })));
const ok = rows.filter((r) => !["F", "L", "N", "F2", "L2"].some((k) => r[k]?.error || !r[k]?.segments?.length));
const still = ok.filter((r) => ks(r.F) === ks(r.F2) && ks(r.L) === ks(r.L2));
const d = still.filter((r) => ks(r[P]) !== ks(r[Q]));
const c = {}; for (const r of rows) { const x = (c[r.file] ||= { rows: 0, ok: 0, still: 0, diff: 0 }); x.rows++; x.ok += ok.includes(r); x.still += still.includes(r); x.diff += d.includes(r); }
fs.writeFileSync(out, JSON.stringify(d));
console.log(P, Q, JSON.stringify(c));
for (const r of d) console.log(r.id, r[P].name, r.highway, "\n ", P, ks(r[P]), "\n ", Q, ks(r[Q]));
