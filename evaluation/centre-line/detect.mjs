// The centre-line detector (lanes-ortho.js centreLine) against the lines marked by eye (evaluation/ortofoto/labels,
// OZNACOVANI.md): per marked carriageway of a two-way road, is there a line down the middle and is it solid or dashed.
// Truth: a marked line of kind solid / double / dashed at least 2.2 m from the marked edges and within a fifth of the
// width of the middle (as the detector looks). Uses the cached orthophotos of evaluation/ortofoto/data (no request).
//   DATA=/path/to/streetdesign/evaluation node evaluation/centre-line/detect.mjs [maxWidth=10] [city …]
//   SRC=cuzk12 …   the 12.5 cm image of ČÚZK instead of the city's finest
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../pilot/public/dmvs.js";
import { ALL, strip } from "../ortofoto/run.mjs";
import { centreLine, CENTRE, brightMap } from "../../pilot/public/lanes-ortho.js";

const DATA = process.env.DATA || "/Users/barasoukupova/streetdesign/evaluation";
const FINEST = { praha: "ipr10", brno: "brno25", plzen: "plzen10" };
const WHO = { praha: ["A", "C", "D"], brno: ["A", "C", "D"], hradec: ["B", "E"], hradec3: ["F"], ostrava: ["B", "E"], plzen: ["C", "E"] };
const MAXW = +(process.argv[2] || 10), CITIES = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(WHO);
const EDGE = CENTRE.edge, PAD = 3;
const rows = [];
for (const city of CITIES) {
  const key = process.env.SRC || FINEST[city] || "cuzk12", dir = path.join(DATA, "ortofoto", "data", city);
  const abDir = path.join(DATA, city === "hradec3" || city === "hradec2" ? "hradec" : city, "data", "ab-city-stejne");
  const index = Object.fromEntries(JSON.parse(await fs.readFile(path.join(dir, "oznac", "index.json"), "utf8")).map((x) => [x.name, x]));
  const seen = new Set();
  // hradec3 (cuts at the passport's hatched areas) has its cuts in results.json only.
  const results = city === "hradec3" ? Object.fromEntries(JSON.parse(await fs.readFile(path.join(dir, "results.json"), "utf8")).map((x) => [x.n, { cut: x.cut, a: { extent: x.extent } }])) : null;
  for (const who of WHO[city]) {
    let lab; try { lab = JSON.parse(await fs.readFile(path.join(DATA, "ortofoto", "labels", `oznac-${city}-${who}.json`), "utf8")); } catch { continue; }
    for (const [name, m] of Object.entries(lab)) {
      const ix = index[name];
      if (!ix || m.quality !== "ok" || (m.edges || []).length < 2 || seen.has(name)) continue;
      seen.add(name);
      const toT = (px) => ix.from + px / ix.pxPerM;
      let r;
      try { r = results ? results[ix.n] : JSON.parse(await fs.readFile(path.join(abDir, `${ix.n}.json`), "utf8")); } catch { continue; }
      if (!r) continue;
      if (!r.a?.extent) continue;
      const file = path.join(dir, "img", key, `${ix.n}.png`);
      let img, bbox;
      try { img = await decodePng(await fs.readFile(file)); bbox = JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox; } catch { continue; }
      const st = strip(img, bbox, r.cut, r.a.extent[0] - PAD, r.a.extent[1] + PAD, ALL[key].res);
      st.fine = key !== "cuzk12" && key !== "cuzk25";
      const edges = m.edges.map(toT), s = edges[0], e = edges.at(-1), w = e - s;
      if (w > MAXW || w < 3) continue;
      const lines = (m.lines || []).map(([px, kind]) => ({ t: toT(px), kind })).filter((l) => l.kind !== "edge" && l.t > s + EDGE && l.t < e - EDGE);
      const mid = (s + e) / 2, win = Math.max(CENTRE.nearMin, CENTRE.near * w);
      const truthL = lines.filter((l) => Math.abs(l.t - mid) <= win);
      const hiway = /motorway|trunk/.test(ix.highway || "");
      const truth = truthL.length ? (truthL.some((l) => l.kind === "solid" || l.kind === "double") ? "solid" : "dashed") : "none";
      const got = centreLine(st, s, e);
      rows.push({ city, name, w: +w.toFixed(1), hw: ix.highway, truth, others: lines.length - truthL.length, got: got === null ? "unknown" : got.found ? got.kind || "line?" : "none", d: got?.t !== undefined && truthL[0] ? +(got.t - truthL[0].t).toFixed(2) : null, fill: got?.fill, share: got?.share, gap: got?.gap, dashes: got?.dashes, regular: got?.regular, note: m.note });
    }
  }
}
const tab = (f) => { const t = {}; for (const r of rows.filter(f)) { const k = `${r.truth} → ${r.got}`; t[k] = (t[k] || 0) + 1; } return t; };
const n = rows.length, known = rows.filter((r) => r.got !== "unknown");
console.log(`${n} carriageways up to ${MAXW} m (marked "ok"), ${n - known.length} unknown to the detector`);
console.log("truth → detector:", tab(() => true));
const has = (x) => x === "solid" || x === "dashed" || x === "line?";
const foundOk = known.filter((r) => has(r.truth) === has(r.got)).length;
console.log(`found / not found: ${foundOk} of ${known.length} (${Math.round((100 * foundOk) / known.length)} %)`);
const both = known.filter((r) => has(r.truth) && has(r.got));
const kindOk = both.filter((r) => r.truth === r.got).length;
console.log(`of lines found by both, the kind right: ${kindOk} of ${both.length}; unsure ${both.filter((r) => r.got === "line?").length}`);
for (const kind of ["solid", "dashed", "none"]) { const q = known.filter((r) => r.truth === kind); console.log(`truth ${kind}: ${q.filter((r) => r.truth === r.got).length} of ${q.length} right`); }
if (process.env.LIST) for (const r of rows.filter((r) => r.truth !== r.got)) console.log(JSON.stringify(r));
if (process.env.FILL) for (const r of both.filter((r) => Math.abs(r.d) < 0.6).sort((a, b) => a.fill - b.fill)) console.log(r.truth.padEnd(7), r.got.padEnd(7), "fill", r.fill, "share", r.share, "gap", r.gap, "dashes", r.dashes, r.regular ? "regular" : "", r.city, r.name);
