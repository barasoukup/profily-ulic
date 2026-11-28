// What the core of a cut needs of a browser, given to Node (node.mjs): the address (flags.js reads location.search) and
// the storage, an OffscreenCanvas and createImageBitmap for the orthophoto's images and the model's OSM hints
// (lanes-ortho.js, ai-kerbs.js). A readback the page recorded (?replay=canvas, canvas-log.js) is given back as it was;
// one it did not (a changed cut in an A/B) is drawn here, close to Chrome but not equal (README "Přehrávka v Node"):
// images decoded by @napi-rs/canvas (Skia's codecs: the same pixels as Chrome's, checked on the recorded JPEG and PNG
// tiles) and drawn by drawImage as Chrome's GPU canvas draws them, measured on 28. 11. 2026: a scaled image sampled
// bilinearly from a mipmap level of 2×2 box averages (rounded half up; level floor(log2 of the downscale)), each value
// rounded (Chrome's sampler: a unit off in about 3 % of the values); a pixel the image's edge covers by less than half is
// left alone, one covered more gets that coverage as its alpha. The hints' lines and polygons by Skia on the CPU (Chrome
// on the GPU: their edges differ by a pixel).
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { opText, canvasKey, DRAWS, STYLES } from "./canvas-log.js";

// The address of the page: the switches, the language (the app reads it only through flags.js and i18n.js), and the
// page's storage, empty as the replay in the page leaves it (Node's own would warn without a file).
export function useAddress(href) {
  globalThis.location = new URL(href);
  const storage = (kept = new Map()) => ({ getItem: (k) => (kept.has(k) ? kept.get(k) : null), setItem: (k, v) => kept.set(k, String(v)), removeItem: (k) => kept.delete(k), clear: () => kept.clear() });
  for (const name of ["localStorage", "sessionStorage"]) Object.defineProperty(globalThis, name, { value: storage(), configurable: true });
}

// A decoded image: its pixels (RGBA, not premultiplied) and the mipmap levels made on the first scaled draw.
class Bitmap {
  constructor(width, height, data) { Object.assign(this, { width, height, data, levels: [{ w: width, h: height, d: data }] }); }
  level(n) {
    while (this.levels.length <= n) {
      const m = this.levels.at(-1), w = Math.max(1, m.w >> 1), h = Math.max(1, m.h >> 1), d = new Uint8ClampedArray(w * h * 4);
      const at = (x, y, ch) => m.d[(Math.min(y, m.h - 1) * m.w + Math.min(x, m.w - 1)) * 4 + ch];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let ch = 0; ch < 4; ch++) {
        d[(y * w + x) * 4 + ch] = (at(2 * x, 2 * y, ch) + at(2 * x + 1, 2 * y, ch) + at(2 * x, 2 * y + 1, ch) + at(2 * x + 1, 2 * y + 1, ch) + 2) >> 2;
      }
      this.levels.push({ w, h, d });
    }
    return this.levels[n];
  }
}

// One pixel of an image laid over the canvas's pixel (both not premultiplied), with the image's coverage.
function over(out, o, r, g, b, a) {
  const da = out[o + 3] / 255, oa = a + da * (1 - a);
  if (!oa) return;
  for (const [ch, v] of [[0, r], [1, g], [2, b]]) out[o + ch] = Math.round((v * a + out[o + ch] * da * (1 - a)) / oa);
  out[o + 3] = Math.round(oa * 255);
}

// The 2D context of a canvas the app draws images on (lanes-ortho.js, ai-kerbs.js orthoPatch): drawImage, getImageData.
class ImageContext {
  constructor(canvas) { this.canvas = canvas; }
  drawImage(img, dx, dy, dw = img.width, dh = img.height) {
    const { width: W, height: H, data: out } = this.canvas;
    // The mipmap level of the downscale, the same across both axes (the app's images are square or scaled evenly).
    const scale = Math.max(img.width / dw, img.height / dh), L = scale >= 2 ? Math.floor(Math.log2(scale)) : 0;
    const m = img.level(L), px = (x, y, ch) => m.d[(Math.max(0, Math.min(m.h - 1, y)) * m.w + Math.max(0, Math.min(m.w - 1, x))) * 4 + ch];
    for (let y = Math.max(0, Math.floor(dy)); y < Math.min(H, Math.ceil(dy + dh)); y++) {
      let cy = Math.min(y + 1, dy + dh) - Math.max(y, dy);
      if (cy < 0.5) continue;
      cy = Math.min(1, cy);
      for (let x = Math.max(0, Math.floor(dx)); x < Math.min(W, Math.ceil(dx + dw)); x++) {
        const cx = Math.min(x + 1, dx + dw) - Math.max(x, dx);
        if (cx < 0.5) continue;
        const u = ((x + 0.5 - dx) * m.w) / dw - 0.5, v = ((y + 0.5 - dy) * m.h) / dh - 0.5;
        const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
        const at = (ch) => Math.round((px(x0, y0, ch) * (1 - fx) + px(x0 + 1, y0, ch) * fx) * (1 - fy) + (px(x0, y0 + 1, ch) * (1 - fx) + px(x0 + 1, y0 + 1, ch) * fx) * fy);
        over(out, (y * W + x) * 4, at(0), at(1), at(2), (at(3) / 255) * Math.min(1, cx) * cy);
      }
    }
  }
  getImageData(x, y, w, h) {
    const { width: W, data } = this.canvas, d = new Uint8ClampedArray(w * h * 4);
    for (let j = 0; j < h; j++) d.set(data.subarray(((y + j) * W + x) * 4, ((y + j) * W + x + w) * 4), j * w * 4);
    return { width: w, height: h, data: d };
  }
}

// A canvas of the app: images (drawImage) on the pixels above, lines and polygons (the model's hints) by Skia; what is
// drawn is logged as the page logs it, and a readback the page recorded is given back (recorded(key) → pixels or null).
let recorded = () => null;
export const canvasStats = { recorded: 0, drawn: 0 };
class OffscreenCanvas {
  constructor(width, height) { Object.assign(this, { width, height, ops: [] }); }
  start(kind) {
    this.kind = kind;
    if (kind === "image") { this.data = new Uint8ClampedArray(this.width * this.height * 4); this.ctx = new ImageContext(this); }
    else this.ctx = createCanvas(this.width, this.height).getContext("2d");
  }
  getContext() {
    return new Proxy({}, {
      get: (_, name) => {
        if (!this.kind) this.start(name === "drawImage" ? "image" : "skia");
        if (name === "getImageData") return (x, y, w, h) => this.read(x, y, w, h);
        const v = this.ctx[name];
        if (typeof v !== "function") return v;
        if (!DRAWS.includes(name)) return v.bind(this.ctx);
        return (...a) => { this.ops.push(opText(name, a.map((x) => (x && typeof x === "object" ? `img:${x.id || "?"}` : x)))); return v.apply(this.ctx, a); };
      },
      set: (_, name, value) => {
        if (!this.kind) this.start("skia");
        if (STYLES.includes(name)) this.ops.push(`${name}=${value}`);
        this.ctx[name] = value;
        return true;
      },
    });
  }
  read(x, y, w, h) {
    const got = recorded(canvasKey(this.width, this.height, this.ops, [x, y, w, h]));
    if (got && got.length === w * h * 4) { canvasStats.recorded++; return { width: w, height: h, data: got }; }
    canvasStats.drawn++;
    return this.ctx.getImageData(x, y, w, h);
  }
}

export function useCanvas(recordedPixels) {
  if (recordedPixels) recorded = recordedPixels;
  globalThis.OffscreenCanvas = OffscreenCanvas;
  // A bitmap of a fetched image (a Blob), decoded by Skia's codecs; its id is the hash of its bytes (as the page's log).
  globalThis.createImageBitmap = async (blob) => {
    const buf = Buffer.from(await blob.arrayBuffer()), img = await loadImage(buf);
    const c = createCanvas(img.width, img.height), g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const bmp = new Bitmap(img.width, img.height, g.getImageData(0, 0, img.width, img.height).data);
    bmp.id = crypto.createHash("sha1").update(buf).digest("hex");
    return bmp;
  };
}
