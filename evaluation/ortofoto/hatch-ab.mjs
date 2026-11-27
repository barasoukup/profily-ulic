// Hatching on the orthophoto (lanes-ortho.js hatchBands, hatched()), with and without it, on the cached cuts of the
// ortofoto experiments (as proto-eval.mjs: the profile of the rules, laid on the orthophoto the app takes for the city;
// Bára 27. 11. 2026). A cut is "changed" when the profile after applyLanes() differs with the hatching on.
//   node evaluation/ortofoto/hatch-ab.mjs [--png <dir>]    → data/hatch-ab.json; PNGs of the changed cuts: the photo
//   of the carriageway with the two profiles as bars under it (A and B in a random order, the key in index.json)
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../pilot/public/dmvs.js";
import { applyLanes, HATCH_PARAMS } from "../../pilot/public/lanes-ortho.js";
import { strip, layout, encodePng } from "./run.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
// city dir of the data, the cut dir, the app's orthophoto
const SETS = [
  ["praha", "praha", "ab-city-stejne", "ipr10"], ["brno", "brno", "ab-city-stejne", "brno25"], ["plzen", "plzen", "ab-city-stejne", "plzen10"],
  ["hradec", "hradec", "ab-city-stejne", "cuzk12"], ["hradec2", "hradec", "ab-city-stejne-samples-vdz", "cuzk12"], ["hradec3", "hradec", "ab-city-stejne-samples-srafy", "cuzk12"], ["ostrava", "ostrava", "ab-city-stejne", "cuzk12"],
];
const RES = { ipr10: 0.1, brno25: 0.1, plzen10: 0.1, cuzk12: 0.125 }, SHIFT = { brno25: [1.06, 3.09] }, PAD = 3;
const COL = { pruh: [90, 90, 98], krajnice: [235, 140, 40], chodnik: [190, 190, 190], zelen: [60, 160, 60], cyklostezka: [200, 80, 80], cyklopruh: [200, 80, 80], parkovani: [120, 120, 200], plocha: [170, 150, 120], bus: [160, 60, 60], tramvaj: [150, 110, 60] };
const pngDir = process.argv.includes("--png") ? process.argv[process.argv.indexOf("--png") + 1] : null;
const rows = [];
for (const [dataCity, abCity, abDir, key] of SETS) {
  const OUT = path.join(ROOT, "data", dataCity), AB = path.join(ROOT, "..", abCity, "data", abDir);
  let files = [];
  try { files = (await fs.readdir(AB)).filter((f) => /^\d+\.json$/.test(f)); } catch { continue; }
  for (const f of files) {
    const n = +f.slice(0, -5), r = JSON.parse(await fs.readFile(path.join(AB, f), "utf8"));
    if (!r.a?.segments?.length || !r.a.runs?.length || !r.a.extent) continue;
    const imgFile = path.join(OUT, "img", key, `${n}.png`);
    let img, meta;
    try { img = await decodePng(await fs.readFile(imgFile)); meta = JSON.parse(await fs.readFile(imgFile + ".json", "utf8")); } catch { continue; }
    const k = Math.cos((r.cut.lat * Math.PI) / 180), [sx, sy] = (SHIFT[key] || [0, 0]).map((v) => v / k);
    const bbox = [meta.bbox[0] - sx, meta.bbox[1] - sy, meta.bbox[2] - sx, meta.bbox[3] - sy];
    const st = { ...strip(img, bbox, r.cut, r.a.extent[0] - PAD, r.a.extent[1] + PAD, RES[key]), fine: key !== "cuzk12" };
    const run = (off) => { HATCH_PARAMS.off = off; const a = structuredClone(r.a); globalThis.__lanesWhy = []; const c = applyLanes(a, { source: key, st }); return { a, c, why: globalThis.__lanesWhy.map((x) => x.why) }; };
    const on = run(false), off = run(true);
    HATCH_PARAMS.off = false;
    const hatched = on.a.segments.some((s) => s.hatched), same = JSON.stringify(on.a.segments) === JSON.stringify(off.a.segments);
    rows.push({ set: dataCity, n, key, street: r.cut.name, highway: r.cut.highway, hatched, same, on: on.a.segments.map((s) => ({ type: s.type, width: s.width, ...(s.hatched ? { hatched: true } : {}), ...(s.dir ? { dir: s.dir } : {}) })), off: off.a.segments.map((s) => ({ type: s.type, width: s.width })), extent: r.a.extent, why: on.why });
    if (pngDir && hatched) await image(rows.at(-1), st, on.a, off.a);
  }
}
const by = {};
for (const x of rows) { const b = (by[x.set] ??= { cuts: 0, hatched: 0, changed: 0 }); b.cuts++; if (x.hatched) b.hatched++; if (!x.same) b.changed++; }
console.log(JSON.stringify(by, null, 1), "\nneshodné bez šraf:", rows.filter((x) => !x.same && !x.hatched).length);
await fs.writeFile(path.join(ROOT, "data", "hatch-ab.json"), JSON.stringify(rows));

// The photo of the roadway ±3 m, ±15 m along, 20 px/m, with a ruler, and under it the profile as a bar: lane grey, shoulder
// orange, hatching yellow-striped, others brown/green/blue by kind.
async function image(row, st, aOn, aOff) {
  const PXM = 20, ALONG = 15, ws = row.extent[0], we = row.extent[1];
  const s = ws, W = Math.round((we - ws) * PXM), H = 2 * ALONG * PXM, BAR = 36, rgba = new Uint8Array(W * (H + 2 * BAR) * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = s + (x + 0.5) / PXM, u = ALONG - (y + 0.5) / PXM, i = Math.floor((t - st.t0) / st.res), j = Math.floor((20 - u) / st.res), o = (y * W + x) * 4;
    rgba[o + 3] = 255;
    if (i < 0 || i >= st.nt || j < 0 || j >= st.nu) continue;
    const q = (j * st.nt + i) * 3;
    rgba[o] = st.rgb[q]; rgba[o + 1] = st.rgb[q + 1]; rgba[o + 2] = st.rgb[q + 2];
  }
  for (let m = 0; m * PXM < W; m++) for (let y = 0; y < (m % 5 ? 6 : 14); y++) { const o = (y * W + m * PXM) * 4; rgba[o] = rgba[o + 1] = rgba[o + 2] = 255; }
  // The bars: the segments run from extent[1] down to extent[0] (derive.js), laid from the left edge (t = extent[0]) up.
  const bar = (a, y0) => {
    let t = ws;
    for (const sg of [...a.segments].reverse()) {
      const x0 = Math.round((t - s) * PXM), x1 = Math.round((t + sg.width - s) * PXM), c = COL[sg.type] || [200, 200, 0];
      for (let y = y0; y < y0 + BAR; y++) for (let x = x0; x < x1; x++) {
        const edge = x === x0 || x === x1 - 1, stripe = sg.hatched && ((x + (y - y0)) % 12 < 5), o = (y * W + x) * 4;
        const col = edge ? [255, 255, 255] : stripe ? [250, 240, 120] : c;
        rgba[o] = col[0]; rgba[o + 1] = col[1]; rgba[o + 2] = col[2]; rgba[o + 3] = 255;
      }
      t += sg.width;
    }
  };
  const flip = (row.n * 7 + row.set.length) % 2 === 0; // which of the two is "A"
  const A = flip ? aOn : aOff, B = flip ? aOff : aOn;
  bar(A, H); bar(B, H + BAR);
  await fs.mkdir(pngDir, { recursive: true });
  const name = `${row.set}-${row.n}`;
  await fs.writeFile(path.join(pngDir, `${name}.png`), encodePng(rgba.subarray(0, W * (H + 2 * BAR) * 4), W, H + 2 * BAR));
  row.png = name; row.A = flip ? "on" : "off";
}
if (pngDir) await fs.writeFile(path.join(pngDir, "index.json"), JSON.stringify(rows.filter((x) => x.png).map(({ set, n, png, A, street, on, off }) => ({ png, set, n, street, A, on, off }))));
