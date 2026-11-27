// Score of the blind A/B: node evaluation/clicks/score.mjs [posudky.json]   (results/klic.json, data/pary.json)
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname), R = async (f) => JSON.parse(await fs.readFile(path.join(ROOT, f), "utf8"));
const key = { ...await R("results/klic.json"), ...await R("results/klic2.json") }, v = { ...await R("results/posudky.json"), ...await R("results/posudky2.json") }, P = Object.fromEntries([...await R("results/pary.json"), ...await R("results/pary2.json")].map((p) => [p.pid, p]));
const val = (k, x) => (x === "X" || x === "Y" ? (key[k][x] === "N" ? 1 : -1) : 0);
const rows = Object.keys(key).map((k) => ({ k, p: P[key[k].pid], a: val(k, v[k][0].verdict), b: val(k, v[k][1].verdict), nej: v[k].some((x) => x.verdict === "nejde") }));
let s = 5; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const show = (name, r) => { const t = r.map((x) => x.a + x.b), w = t.filter((x) => x > 0).length, l = t.filter((x) => x < 0).length, both = r.filter((x) => x.a + x.b === 2).length, bothL = r.filter((x) => x.a + x.b === -2).length;
  const bs = Array.from({ length: 2000 }, () => { let W = 0, L = 0; for (let i = 0; i < t.length; i++) { const q = t[Math.floor(rnd() * t.length)]; W += q > 0; L += q < 0; } return (W - L) / t.length; }).sort((x, y) => x - y);
  console.log(`${name}: ${r.length} dvojic, N lépe ${w} : ${l} (shodně oba ${both} : ${bothL}), hlasů ${r.reduce((m, x) => m + (x.a > 0) + (x.b > 0), 0)} : ${r.reduce((m, x) => m + (x.a < 0) + (x.b < 0), 0)}, rozdíl ${(100 * (w - l) / (r.length || 1)).toFixed(0)} % (${(100 * bs[50]).toFixed(0)}; ${(100 * bs[1949]).toFixed(0)}), nejde ${r.filter((x) => x.nej).length}`); };
for (const [q, n] of [["A", "oprava uličky × dnes"], ["S", "pravidla obslužných × bez nich"], ["U", "nesplnitelné obslužné dnes × vynechané"], ["L", "bez limitu × limit 25 m"]]) {
  const r = rows.filter((x) => x.p.sets.includes(q)); show(`**${n}**`, r);
  for (const c of [...new Set(r.map((x) => x.p.city))]) show("  " + c, r.filter((x) => x.p.city === c));
  const big = r.filter((x) => Math.abs(x.p.N.moved) > 25); if (big.length && q !== "A") show("  posun nových > 25 m", big);
}
show("S+L oba", rows.filter((x) => x.p.sets.length > 1));
if (process.argv.includes("-v")) for (const x of rows.filter((x) => x.a + x.b < 0)) console.log(x.p.sets.join("+"), x.p.id, x.p.name || "", x.p.highway, `N ${x.p.N.moved} O ${x.p.O.moved}`, x.a, x.b, v[x.k].map((y) => `${y.jistota[0]}: ${y.why}`).join(" || "));
