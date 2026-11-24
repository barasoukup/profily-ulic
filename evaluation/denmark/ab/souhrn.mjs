// Summary of the A/B of Copenhagen's kerb lines and parking areas (vysledky/rezy.json from sber.js; verdicts in
// vysledky/posudky-kant.json and posudky-park.json: { id: "a" | "b" | "stejne" | "?" }): per layer how many cuts used
// it, how many profiles differ, and the verdicts; writes vysledky/rezy-kant.json and rezy-park.json (A against B as
// evaluation/slovensko/ab/obrazky.mjs reads them, ids prefixed so the cached images do not mix).
//   node evaluation/denmark/ab/souhrn.mjs
//   ORTHO=dk IN=../../denmark/ab/vysledky/rezy-kant.json OUT=../../denmark/ab/images-kant node evaluation/slovensko/ab/obrazky.mjs
import fs from "node:fs";
const dir = new URL("vysledky/", import.meta.url);
const rows = JSON.parse(fs.readFileSync(new URL("rezy.json", dir), "utf8"));
const parts = (p) => (p?.segments || []).map(([t, w]) => `${t}:${w}`).join(" ");
const LAYERS = { kant: ["K", (p) => p?.sources?.skEdges === "kbh-vejkant"], park: ["P", (p) => !!p?.sources?.dkParking] };
for (const [layer, [arm, used]] of Object.entries(LAYERS)) {
  let verdicts = {};
  try { verdicts = JSON.parse(fs.readFileSync(new URL(`posudky-${layer}.json`, dir), "utf8")); } catch {}
  const out = rows.map((r) => ({ id: `dk${layer[0]}-${r.id}`, town: r.town, A: r.A, B: r[arm] }));
  fs.writeFileSync(new URL(`rezy-${layer}.json`, dir), JSON.stringify(out, null, 1));
  const towns = {};
  for (const r of rows) {
    const t = (towns[r.town] ??= { cuts: 0, used: 0, differ: 0, errors: 0, a: 0, b: 0, stejne: 0, "?": 0 });
    t.cuts++;
    if (r.A?.error || r[arm]?.error) t.errors++;
    if (used(r[arm])) t.used++;
    if (parts(r.A) !== parts(r[arm])) t.differ++;
    const v = verdicts[r.id]?.v ?? verdicts[r.id];
    if (typeof v === "string" && v in t) t[v]++;
  }
  console.log(`\n${layer}: město | řezů | vrstva použita | liší se | chyba | lépe s ní | lépe bez | stejně | nejasné`);
  for (const [k, t] of Object.entries(towns)) console.log([k, t.cuts, t.used, t.differ, t.errors, t.b, t.a, t.stejne, t["?"]].join(" | "));
  for (const r of rows) if (parts(r.A) !== parts(r[arm])) console.log(`  ${r.id} ${r.A?.name || ""}\n    A ${parts(r.A)}\n    B ${parts(r[arm])}`);
}
