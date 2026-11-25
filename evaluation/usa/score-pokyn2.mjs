// Washington judged again (25. 11. 2026) with the instruction of 25. 11. (../universal/POKYN.md): new blind judges of
// the pilot's 32 cuts (../usa-dc/vysledky/pokyn2, the neutral prompt: the result) against the app with DC's map
// (us-meas2.json, as it stays), without it (us-ab.json dc0; collected with the tree pits still on and without dc-8-3) and OSM only (the pilot's app-osm.json). Beside it the
// pilot's judges (the old instruction) and the first run of the new ones, whose prompt said the strips are very common in
// DC (pokyn2-napoveda: a leading hint, kept for comparison only). The profiles are compared on the same cuts.
//   node evaluation/usa/score-pokyn2.mjs > evaluation/usa/vysledky/skore-pokyn2.md
import fs from "node:fs/promises";
import path from "node:path";
import { compare, asClasses, composition, scope } from "../universal/compare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname), PILOT = path.join(HERE, "..", "usa-dc"), UD = path.join(HERE, "..", "universal", "data");
const json = async (p) => JSON.parse(await fs.readFile(p, "utf8"));
const read = async (dir) => new Map((await Promise.all((await fs.readdir(dir)).filter((f) => /^u-us.*\.jsonl$/.test(f)).map((f) => fs.readFile(path.join(dir, f), "utf8")))).join("\n").split("\n").filter(Boolean).map((l) => JSON.parse(l)).map((j) => [j.id, j]));
const J = { pilot: await read(path.join(PILOT, "vysledky")), hint: await read(path.join(PILOT, "vysledky", "pokyn2-napoveda")), nove: await read(path.join(PILOT, "vysledky", "pokyn2")) };
const mapOf = (rows) => new Map(rows.filter((r) => r.parts?.length).map((r) => [r.id, r]));
const A = {
  "s mapou DC": mapOf(await json(path.join(UD, "us-meas2.json"))),
  "bez mapy (?dc=0)": mapOf((await json(path.join(UD, "us-ab.json"))).filter((r) => r.id.startsWith("dc-") && r.variant === "dc0")),
  "jen OSM": mapOf(await json(path.join(PILOT, "data", "app-osm.json"))),
};
const LANE = ["pruh", "pruh_piktokoridor", "obsluzna", "bus", "bus_cyklo", "tramvaj_v_pruhu"];
const ids = (await json(path.join(PILOT, "sample.json"))).map((r) => r.id);
const pct = (a, n) => `${Math.round((100 * a) / n)} %`, open = (j) => ({ A: j.facadeA === false, B: j.facadeB === false });
for (const [v, title, all] of [["nove", "Noví posuzovatelé, nový pokyn (výsledek), 30 řezů pilotu bez dc-8-3"], ["nove", "Totéž s dc-3-1 a dc-6-2, které pilot označil jako „není ulice“", true], ["pilot", "Posudky pilotu (starý pokyn)"], ["hint", "Noví posuzovatelé, pokyn s nápovědou v zadání (jen pro srovnání)"]]) {
  const use = ids.filter((id) => { const j = J[v].get(id); return j?.usable && (all || J.pilot.get(id)?.usable) && Object.values(A).every((m) => m.get(id)) && [...A["s mapou DC"].get(id).parts.map((p) => p[0]), ...j.parts.map((p) => String(p[0]).replace("?", ""))].some((t) => LANE.includes(t)); });
  console.log(`\n## ${title}: ${use.length} řezů\n\n| profil | složení stejné | shoda složení | pruhy stejně | šířka do 1 / 2 m | nejčastější rozdíly |\n|---|---|---|---|---|---|`);
  const sc = {};
  for (const [n, m] of Object.entries(A)) {
    const r = use.map((id) => compare(J[v].get(id).parts, m.get(id).parts, true, false, open(J[v].get(id)))), e = {}; sc[n] = r;
    for (const x of r) for (const y of x.edits) e[y] = (e[y] || 0) + 1;
    console.log(`| ${n} | ${pct(r.filter((x) => x.same).length, r.length)} | **${pct(r.reduce((a, x) => a + x.score, 0), r.length)}** | ${pct(r.filter((x) => x.lanesA === x.lanesB).length, r.length)} | ${pct(r.filter((x) => Math.abs(x.widthA - x.widthB) <= 1).length, r.length)} / ${pct(r.filter((x) => Math.abs(x.widthA - x.widthB) <= 2).length, r.length)} | ${Object.entries(e).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, c]) => `${k} ${c}×`).join(", ")} |`);
  }
  if (!all) { // dc-8-3 has no profile without the map: the two others on all 30.
    const x30 = ids.filter((id) => J[v].get(id)?.usable && J.pilot.get(id)?.usable && ["s mapou DC", "jen OSM"].every((n) => A[n].get(id)));
    for (const n of ["s mapou DC", "jen OSM"]) console.log(`| ${n}, všech ${x30.length} | | ${pct(x30.reduce((a, id) => a + compare(J[v].get(id).parts, A[n].get(id).parts, true, false, open(J[v].get(id))).score, 0), x30.length)} | | | |`);
  }
  const [M, N] = [sc["s mapou DC"], sc["bez mapy (?dc=0)"]];
  const d = M.map((x, i) => x.score - N[i].score), mean = d.reduce((a, b) => a + b, 0) / d.length;
  let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648), boot = Array.from({ length: 5000 }, () => d.reduce((a) => a + d[Math.floor(rnd() * d.length)], 0) / d.length).sort((a, b) => a - b);
  console.log(`\nMapa proti bez mapy, po řezech (složení): lépe ${d.filter((x) => x > 1e-9).length}, hůř ${d.filter((x) => x < -1e-9).length}, stejně ${d.filter((x) => Math.abs(x) <= 1e-9).length}; rozdíl ${(100 * mean).toFixed(0)} bodů (95 % ${(100 * boot[125]).toFixed(0)} až ${(100 * boot[4875]).toFixed(0)}).`);
  console.log("\n| prvek v uličním prostoru | posuzovatel má | " + Object.keys(A).map((k) => `${k} souhlasí`).join(" | ") + " |\n|---|---|---|---|---|");
  const has = (parts, judge, o, c) => scope(asClasses(parts, judge), o).parts.some(([x]) => x === c);
  for (const c of ["stani", "zelen", "delici", "chodnik"]) console.log(`| ${c} | ${use.filter((id) => has(J[v].get(id).parts, true, open(J[v].get(id)), c)).length} | ${Object.values(A).map((m) => use.filter((id) => has(J[v].get(id).parts, true, open(J[v].get(id)), c) === has(m.get(id).parts, false, open(J[v].get(id)), c)).length).join(" | ")} |`);
  const kinds = new Map((await json(path.join(PILOT, "sample.json"))).map((r) => [r.id, r.kind]));
  console.log("\n| typ | řezů | s mapou | bez mapy | jen OSM |\n|---|---|---|---|---|");
  for (const k of ["residential", "collector", "arterial"]) { const i = use.map((id, q) => (kinds.get(id) === k ? q : -1)).filter((q) => q >= 0); console.log(`| ${k} | ${i.length} | ${Object.values(sc).map((r) => pct(i.reduce((a, q) => a + r[q].score, 0), i.length)).join(" | ")} |`); }
}
console.log("\n## Po řezech (noví posuzovatelé, nový pokyn)\n\n| řez | posuzovatel pilotu | nový | s mapou | bez mapy | shoda s mapou / bez |\n|---|---|---|---|---|---|");
const seq = (p, j) => composition(asClasses(p, j)).join(" ");
for (const id of ids) { const j = J.nove.get(id), m = A["s mapou DC"].get(id), z = A["bez mapy (?dc=0)"].get(id); if (!j?.usable || !m || !z) { console.log(`| ${id} | – | ${j?.usable ? "" : "není ulice"}| | | |`); continue; }
  const s = (x) => Math.round(100 * compare(j.parts, x.parts, true, false, open(j)).score); console.log(`| ${id} | ${J.pilot.get(id)?.usable ? seq(J.pilot.get(id).parts, true) : "–"} | ${seq(j.parts, true)} | ${seq(m.parts)} | ${seq(z.parts)} | ${s(m)} / ${s(z)} |`); }
