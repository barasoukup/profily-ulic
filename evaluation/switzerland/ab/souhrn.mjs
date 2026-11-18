// A summary of the A/B test of the cadastral survey (vysledky/rezy.json: A = ?av=0, the estimate from SWISSIMAGE and
// OSM; B = with the survey): per town how many cuts took the survey and how many profiles differ.
//   node evaluation/switzerland/ab/souhrn.mjs
import fs from "node:fs";
const rows = JSON.parse(fs.readFileSync(new URL("vysledky/rezy.json", import.meta.url), "utf8"));
const parts = (p) => (p?.segments || []).map(([t, w]) => `${t}:${w}`).join(" ");
const by = {};
for (const r of rows) {
  const t = (by[r.town] ??= { n: 0, av: 0, diff: 0, err: 0 });
  t.n++;
  if (r.B?.sources?.chAv) t.av++;
  if (parts(r.A) !== parts(r.B)) t.diff++;
  if (r.A?.error || r.B?.error) t.err++;
}
console.log("| město | řezů | vyměřování použito | profil se liší | chyba |\n|---|---|---|---|---|");
for (const [k, v] of Object.entries(by)) console.log(`| ${k} | ${v.n} | ${v.av} | ${v.diff} | ${v.err} |`);
