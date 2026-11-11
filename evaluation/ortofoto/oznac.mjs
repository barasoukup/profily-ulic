// Images for an independent check by eye (Bára 11. 11. 2026: a bigger sample, independent tests, more places).
// Per chosen cut and carriageway: the finest orthophoto of the city around the carriageway (its edges from the
// surface map, ±3 m, ±15 m along the street), 20 px per metre both ways, with nothing of ours drawn in, only a
// ruler (a tick per metre top and bottom, a long one every 5 m). Whoever checks marks the kerbs and the lines in
// pixels; zoom gives a magnified piece with a fine pixel scale for exact positions.
//   CITY=praha node evaluation/ortofoto/oznac.mjs make n …       → data/<city>/oznac/<n>-<w>.png, index.json
//   node evaluation/ortofoto/oznac.mjs zoom <png> <x0> <x1> [<y0> <y1>] <out.png>
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../pilot/public/dmvs.js";
import { ALL, strip, layout, encodePng } from "./run.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "praha";
const OUT = path.join(ROOT, "data", CITY);
export const FINEST = { praha: "ipr10", brno: "brno25", plzen: "plzen10" }; // others: ČÚZK 12.5 cm
const PXM = 20, MARGIN = 3, ALONG = 15;

async function make(ns) {
  const key = FINEST[CITY] || "cuzk12", res = ALL[key].res;
  const dir = path.join(OUT, "oznac");
  await fs.mkdir(dir, { recursive: true });
  const index = [];
  for (const n of ns) {
    let r, img, bbox;
    try {
      r = JSON.parse(await fs.readFile(path.join(ROOT, "..", CITY, "data", "ab-city-stejne", `${n}.json`), "utf8"));
      const file = path.join(OUT, "img", key, `${n}.png`);
      img = await decodePng(await fs.readFile(file));
      bbox = JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox;
    } catch { continue; }
    const p = r.a, L = layout(p);
    const st = strip(img, bbox, r.cut, p.extent[0] - 3, p.extent[1] + 3, res);
    for (const [w, way] of L.ways.entries()) {
      if (!way.geo || way.e - way.s < 4) continue;
      const s = way.s - MARGIN, e = way.e + MARGIN, W = Math.round((e - s) * PXM), H = 2 * ALONG * PXM;
      const rgba = new Uint8Array(W * H * 4);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const t = s + (x + 0.5) / PXM, u = ALONG - (y + 0.5) / PXM;
        const i = Math.floor((t - st.t0) / res), j = Math.floor((20 - u) / res), o = (y * W + x) * 4;
        rgba[o + 3] = 255;
        if (i < 0 || i >= st.nt || j < 0 || j >= st.nu) continue;
        const q = (j * st.nt + i) * 3;
        rgba[o] = st.rgb[q]; rgba[o + 1] = st.rgb[q + 1]; rgba[o + 2] = st.rgb[q + 2];
      }
      // Ruler: white ticks every metre (6 px), every 5 m 14 px, at the top and the bottom.
      for (let m = 0; m * PXM < W; m++) for (let y = 0; y < (m % 5 ? 6 : 14); y++) for (const yy of [y, H - 1 - y]) { const o = (yy * W + m * PXM) * 4; rgba[o] = rgba[o + 1] = rgba[o + 2] = 255; }
      const name = `${n}-${w}`;
      await fs.writeFile(path.join(dir, `${name}.png`), encodePng(rgba, W, H));
      index.push({ name, n, way: w, street: r.cut.name, highway: r.cut.highway, source: key, from: +s.toFixed(3), pxPerM: PXM, width: W, height: H });
    }
  }
  await fs.writeFile(path.join(dir, "index.json"), JSON.stringify(index, null, 1));
  console.log(`${index.length} obrázků v ${dir}`);
}

// A magnified piece (x0–x1, y0–y1 of the image, 6×), with a scale of the image's own pixels: a tick every 5 px,
// a long one every 10 px, a red one every 50 px (at x = 0, 50, 100 … of the whole image), along the top.
async function zoom(file, x0, x1, y0, y1, out) {
  const img = await decodePng(await fs.readFile(file));
  y0 ??= 0; y1 ??= img.height;
  const Z = 6, W = (x1 - x0) * Z, H = (y1 - y0) * Z + 30, rgba = new Uint8Array(W * H * 4);
  for (let o = 0; o < 30 * W * 4; o += 4) { rgba[o] = rgba[o + 1] = rgba[o + 2] = 40; rgba[o + 3] = 255; } // the scale's band
  for (let y = 30; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = x0 + Math.floor(x / Z), sy = y0 + Math.floor((y - 30) / Z), o = (y * W + x) * 4, q = (sy * img.width + sx) * 4;
    rgba[o] = img.rgba[q]; rgba[o + 1] = img.rgba[q + 1]; rgba[o + 2] = img.rgba[q + 2]; rgba[o + 3] = 255;
  }
  for (let px = Math.ceil(x0 / 5) * 5; px < x1; px += 5) {
    const X = (px - x0) * Z + Math.floor(Z / 2), len = px % 50 === 0 ? 30 : px % 10 === 0 ? 20 : 10, c = px % 50 === 0 ? [255, 0, 0] : [255, 255, 255];
    for (let y = 0; y < len; y++) for (const dx of [0, 1]) { const o = (y * W + X + dx) * 4; if (X + dx < W) { rgba[o] = c[0]; rgba[o + 1] = c[1]; rgba[o + 2] = c[2]; rgba[o + 3] = 255; } }
  }
  await fs.writeFile(out, encodePng(rgba, W, H));
}

const [cmd, ...a] = process.argv.slice(2);
if (cmd === "make") await make(a.map(Number));
else if (cmd === "zoom") await zoom(a[0], +a[1], +a[2], a[3] !== undefined && a.length > 4 ? +a[3] : undefined, a.length > 4 ? +a[4] : undefined, a.at(-1));
