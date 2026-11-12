// The prototype (pilot/public/lanes-ortho.js) against the independent marks by eye (OZNACOVANI.md,
// labels/oznac-<city>-<who>.json): per marked carriageway (quality "ok", both edges marked) the boundaries inside it
// (≥ 0.7 m from its edges) of
//   pravidla   the profile as the rules drew it (r.a of evaluation/<city>/data/ab-city-stejne), laid on the map;
//   ortofoto   the same profile after applyLanes() on the orthophoto the app takes for that city (Prague IPR 10 cm,
//              Brno 2025 moved by its shift, Plzeň 2024, elsewhere ČÚZK 12.5 cm),
// both moved by the true shift of the map against the image (the marked edges), against the marked lines.
//   node evaluation/ortofoto/proto-eval.mjs        → printed, data/proto-eval.json
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../pilot/public/dmvs.js";
import { applyLanes } from "../../pilot/public/lanes-ortho.js";
import { strip, median, layout } from "./run.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITIES = { praha: "ipr10", brno: "brno25", plzen: "plzen10", hradec: "cuzk12", ostrava: "cuzk12" };
const RES = { ipr10: 0.1, brno25: 0.1, plzen10: 0.1, cuzk12: 0.125 };
const SHIFT = { brno25: [1.06, 3.09] }; // as lanes-ortho.js: where the image shows a point, east and north (m)
const MATCH = 0.3, EDGE = 0.7, PAD = 3;
const near = (list, t) => (list.length ? Math.min(...list.map((x) => Math.abs(x - t))) : Infinity);
const tally = {}, rows = [];
const add = (k, v) => (tally[k] ??= []).push(v);

for (const [city, key] of Object.entries(CITIES)) {
  const OUT = path.join(ROOT, "data", city), AB = path.join(ROOT, "..", city, "data", "ab-city-stejne");
  const index = Object.fromEntries(JSON.parse(await fs.readFile(path.join(OUT, "oznac", "index.json"), "utf8")).map((x) => [x.name, x]));
  const files = (await fs.readdir(path.join(ROOT, "labels"))).filter((f) => f.startsWith(`oznac-${city}-`) && f.endsWith(".json"));
  for (const file of files) {
    const who = file.slice(`oznac-${city}-`.length, -5), lab = JSON.parse(await fs.readFile(path.join(ROOT, "labels", file), "utf8"));
    for (const [name, m] of Object.entries(lab)) {
      const ix = index[name];
      if (!ix || m.quality !== "ok" || (m.edges || []).length < 2) continue;
      const r = JSON.parse(await fs.readFile(path.join(AB, `${ix.n}.json`), "utf8"));
      const imgFile = path.join(OUT, "img", key, `${ix.n}.png`);
      let img, meta;
      try { img = await decodePng(await fs.readFile(imgFile)); meta = JSON.parse(await fs.readFile(imgFile + ".json", "utf8")); } catch { continue; }
      const toT = (px) => ix.from + px / ix.pxPerM;
      const edges = m.edges.map(toT), ws = edges[0], we = edges.at(-1);
      const inside = (t) => t > ws + EDGE && t < we - EDGE;
      const truth = (m.lines || []).map(([px]) => toT(px)).filter(inside);
      // The rules' profile and the prototype's, each laid on the map; the roadway over the marked carriageway.
      const before = layout(r.a);
      const a2 = structuredClone(r.a);
      const k = Math.cos((r.cut.lat * Math.PI) / 180), [sx, sy] = (SHIFT[key] || [0, 0]).map((v) => v / k);
      const bbox = [meta.bbox[0] - sx, meta.bbox[1] - sy, meta.bbox[2] - sx, meta.bbox[3] - sy];
      const st = { ...strip(img, bbox, r.cut, r.a.extent[0] - PAD, r.a.extent[1] + PAD, RES[key]), fine: key !== "cuzk12" };
      const changed = applyLanes(a2, { source: key, st });
      const after = layout(a2);
      const wayOf = (L) => L.ways.filter((w) => w.geo).reduce((b, w) => { const o = Math.min(w.e, we) - Math.max(w.s, ws); return o > (b?.o ?? 0) ? { w, o } : b; }, null)?.w;
      const w0 = wayOf(before), w1 = wayOf(after);
      if (!w0 || !w1) continue;
      const dTrue = median([ws - w0.s, we - w0.e]);
      const bounds = (w) => w.parts.slice(1).map((p) => p.s + dTrue).filter(inside);
      const row = { city, who, name, n: ix.n, street: ix.street, changed, truth: truth.length };
      for (const [set, b] of [["pravidla", bounds(w0)], ["ortofoto", bounds(w1)]]) {
        const errs = truth.map((t) => near(b, t));
        row[set] = { lanes: b.length + 1, hit: errs.filter((e) => e <= MATCH).length, extra: b.filter((t) => near(truth, t) > MATCH).length, parts: (set === "pravidla" ? w0 : w1).parts.map((p) => `${p.type} ${p.w.toFixed(2)}`) };
        add(`${city} ${set}`, { ...row[set], trueLanes: truth.length + 1, errs });
        add(`vše ${set}`, { ...row[set], trueLanes: truth.length + 1, errs });
      }
      rows.push(row);
    }
  }
}

const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : "–");
for (const [k, v] of Object.entries(tally)) {
  const errs = v.flatMap((x) => x.errs);
  console.log(`${k.padEnd(20)} vozovek ${String(v.length).padStart(3)}: počet pruhů správně ${pct(v.filter((x) => x.lanes === x.trueLanes).length, v.length).padStart(5)}, čáry do 0,3 m ${pct(errs.filter((e) => e <= MATCH).length, errs.length).padStart(5)} (${errs.filter((e) => e <= MATCH).length}/${errs.length}), hranic navíc ${v.reduce((a, x) => a + x.extra, 0)}`);
}
const better = rows.filter((r) => r.ortofoto.hit > r.pravidla.hit || (r.ortofoto.hit === r.pravidla.hit && r.ortofoto.extra < r.pravidla.extra)).length;
const worse = rows.filter((r) => r.ortofoto.hit < r.pravidla.hit || (r.ortofoto.hit === r.pravidla.hit && r.ortofoto.extra > r.pravidla.extra)).length;
console.log(`vozovek ${rows.length}: ortofoto lépe ${better}, hůře ${worse}, stejně ${rows.length - better - worse}`);
await fs.writeFile(path.join(ROOT, "data", "proto-eval.json"), JSON.stringify({ rows }, null, 1));
