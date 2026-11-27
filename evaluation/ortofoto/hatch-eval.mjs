// Hatching (V 13) found on the orthophoto, against the marked hatch ranges (labels/oznac-*.json; OZNACOVANI.md), as
// krajnice.mjs did for its older detectors (Bára 27. 11. 2026: the hatched strip in the middle of a roadway).
// Per marked roadway of quality "ok": the bands hatchBands() (lanes-ortho.js) finds in the map's carriageway, against
// the marked ranges. Out: per orthophoto the roadways with hatching marked / found, the roadways without it / found.
//   node evaluation/ortofoto/hatch-eval.mjs [-v]      PSET='{"rms":6}' sets other values of HATCH_PARAMS
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../app/public/dmvs.js";
import { ALL, strip, layout } from "./run.mjs";
import { FINEST } from "./oznac.mjs";
import { hatchBands, HATCH_PARAMS } from "../../app/public/lanes-ortho.js";
if (process.env.PSET) Object.assign(HATCH_PARAMS, JSON.parse(process.env.PSET));
const f2 = (q) => [q.s, q.e, `sh${q.share} sg${q.sign?.toFixed(2)} co${q.coh?.toFixed(2)} rm${q.rms?.toFixed(1)} al${q.a?.toFixed(2)} ry${q.rhy?.toFixed(2)} am${q.amp?.toFixed(1)}`];
const ROOT = path.dirname(new URL(import.meta.url).pathname), PAD = 3, V = process.argv.includes("-v");
const overlap = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
const files = (await fs.readdir(path.join(ROOT, "labels"))).filter((f) => /^oznac-.*\.json$/.test(f));
const rows = [];
for (const f of files) {
  const [, CITY, who] = f.replace(".json", "").split("-");
  const OUT = path.join(ROOT, "data", CITY), AB = path.join(ROOT, "..", CITY.replace(/\d+$/, ""), "data", { hradec3: "ab-city-stejne-samples-srafy", hradec2: "ab-city-stejne-samples-vdz" }[CITY] || "ab-city-stejne");
  let index, lab;
  try { index = Object.fromEntries(JSON.parse(await fs.readFile(path.join(OUT, "oznac", "index.json"), "utf8")).map((x) => [x.name, x])); lab = JSON.parse(await fs.readFile(path.join(ROOT, "labels", f), "utf8")); } catch { continue; }
  for (const [name, m] of Object.entries(lab)) {
    const ix = index[name];
    if (!ix || m.quality !== "ok" || (m.edges || []).length < 2) continue;
    const toT = (px) => ix.from + px / ix.pxPerM;
    let r;
    try { r = JSON.parse(await fs.readFile(path.join(AB, `${ix.n}.json`), "utf8")); } catch { continue; }
    if (!r.a?.extent) continue;
    const L = layout(r.a), way = L.ways[ix.way];
    if (!way) continue;
    const hatch = (m.hatch || []).map(([a, b]) => [toT(Math.min(a, b)), toT(Math.max(a, b))]);
    for (const key of [...new Set([FINEST[CITY.replace(/\d+$/, "")] || "cuzk12", "cuzk12"])]) {
      const file = path.join(OUT, "img", key, `${ix.n}.png`);
      let st;
      try { st = strip(await decodePng(await fs.readFile(file)), JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox, r.cut, r.a.extent[0] - PAD, r.a.extent[1] + PAD, ALL[key].res); } catch { continue; }
      const found = hatchBands(st, way.s + 0.4, way.e - 0.4);
      const side = HATCH_PARAMS.side, mid = (h) => h[0] - way.s >= side && way.e - h[1] >= side;
      rows.push({ city: CITY, who, name, key, truth: hatch.filter(mid), found, w: [way.s, way.e], wide: way.e - way.s });
    }
  }
}
const keys = [...new Set(rows.map((x) => x.key))];
for (const key of keys) {
  const R = rows.filter((x) => x.key === key), T = R.filter((x) => x.truth.length), N = R.filter((x) => !x.truth.length);
  const hit = T.filter((x) => x.found.some((q) => x.truth.some((h) => overlap([q.s, q.e], h) >= 0.5 * Math.min(q.e - q.s, h[1] - h[0])))), fp = N.filter((x) => x.found.length);
  console.log(`${key}: se šrafami ${T.length}, nalezeno ${hit.length}; bez šraf ${N.length}, falešně ${fp.length}`);
  if (V) { for (const x of T) console.log("  T", x.city, x.who, x.name, JSON.stringify(x.truth.map((h) => h.map((v) => +v.toFixed(1)))), "→", JSON.stringify(x.found.map(f2))); for (const x of fp) console.log("  F", x.city, x.who, x.name, JSON.stringify(x.found.map(f2))); }
}
