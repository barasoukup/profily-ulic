// Tables of a collection (collect.mjs): node evaluation/kliky/report.mjs vysledky/kliky.json [big=now]
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname), rows = JSON.parse(await fs.readFile(path.join(ROOT, process.argv[2]), "utf8"));
const big = process.argv[3], K = Object.keys(rows[0].v), q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) * p)] : 0; };
const stat = (a) => `${(100 * a.filter((x) => x > 1).length / a.length).toFixed(0)} % / ${q(a, 0.9).toFixed(0)} / ${q(a, 0.99).toFixed(0)} / ${Math.max(0, ...a).toFixed(0)} / ${a.filter((x) => x > 25).length}`;
const table = (name, of) => { console.log(`\n| ${name} | n | ${K.join(" | ")} |\n|---|---|${K.map(() => "---|").join("")}`); for (const g of [...new Set(rows.map(of))]) { const r = rows.filter((x) => of(x) === g); console.log(`| ${g} | ${r.length} | ${K.map((k) => stat(r.map((x) => x.v[k].moved))).join(" | ")} |`); } };
console.log("posunuto > 1 m / 90. percentil / 99. / nejvíc (m) / počet přes 25 m");
table("vše", () => "vše"); table("druh cesty", (r) => r.kind); table("vzorek", (r) => r.stratum); table("město", (r) => r.city);
const F = { "konec cesty do 3 m": (r, v) => v.end < 3 && v.moved > 1, "přes další křižovatku (ulice)": (r, v) => /street/.test(v.past || ""), "přes další křižovatku (i obslužná)": (r, v) => v.past, "zbylá křižovatka": (r, v) => v.left.length, "zbylá křižovatka po posunu > 5 m": (r, v) => v.left.length && v.moved > 5, "nenačtená křižovatka": (r, v) => v.unseen };
console.log(`\n| chyba | ${K.join(" | ")} |\n|---|${K.map(() => "---|").join("")}`);
for (const [n, f] of Object.entries(F)) console.log(`| ${n} | ${K.map((k) => rows.filter((r) => f(r, r.v[k])).length).join(" | ")} |`);
const other = rows.filter((r) => r.nearest);
console.log(`\njiná cesta než nejbližší: ${other.length}`, JSON.stringify(other.reduce((m, r) => { const k = `${r.nearest.footway || r.nearest.highway}→${r.highway}`; m[k] = (m[k] || 0) + 1; return m; }, {})));
console.log("jen sousední pravidlo (posun > 1 m):", K.map((k) => `${k} ${JSON.stringify(rows.reduce((m, r) => { if (r.v[k].moved > 1) for (const c of r.v[k].cause) m[c] = (m[c] || 0) + 1; return m; }, {}))}`).join("\n"));
if (big) for (const r of rows.filter((x) => x.v[big].moved > 25)) console.log(r.id, r.stratum, r.highway, r.service || "", r.name || "", `len ${r.len} from ${r.from}`, r.lat, r.lon, r.way, JSON.stringify(r.v[big]), K.map((k) => `${k} ${r.v[k].moved}`).join(" "));
