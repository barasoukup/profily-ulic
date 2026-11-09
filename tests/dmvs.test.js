// Surfaces read from the map images of the national DTM (pilot/public/dmvs.js): the PNG decoder, the areas
// of an image and their outlines, the type names of GetFeatureInfo.
import { test } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";

const { decodePng, classify, components, trace, simplify, typeCode } = await import("../pilot/public/dmvs.js");

// A PNG as the WMS answers it (palette with transparency), lines filtered with Sub, Up and Paeth.
function png(w, h, palette, alpha, pixels) {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (name, data) => {
    const body = Buffer.concat([Buffer.from(name), data]), out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0); body.copy(out, 4); out.writeUInt32BE(crc(body), body.length + 4);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 3;
  const raw = [];
  for (let y = 0; y < h; y++) {
    const f = y % 3 === 0 ? 1 : y % 3 === 1 ? 2 : 4, row = pixels.slice(y * w, (y + 1) * w), up = y ? pixels.slice((y - 1) * w, y * w) : row.map(() => 0);
    raw.push(f);
    row.forEach((v, x) => {
      const a = x ? row[x - 1] : 0, b = up[x], c = x ? up[x - 1] : 0;
      const p = a + b - c, pr = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
      raw.push((v - (f === 1 ? a : f === 2 ? b : pr) + 256) & 255);
    });
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("PLTE", Buffer.from(palette.flat())),
    chunk("tRNS", Buffer.from(alpha)), chunk("IDAT", zlib.deflateSync(Buffer.from(raw))), chunk("IEND", Buffer.alloc(0)),
  ]);
}

// 12 × 8 px: blank (0) around a white roadway (1, rows 4–6) with a yellow sidewalk (2, rows 1–3) along its top
// (a strip narrower than 3 px has no pixel whose four neighbours share its colour: it would not be an area).
const W = 12, H = 8;
const pixels = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pixels.push(y < 1 || y > 6 ? 0 : y < 4 ? 2 : 1);
const PALETTE = [[0, 0, 0], [255, 255, 255], [255, 254, 232]];

test("DMVS: dekódování PNG s paletou a průhledností", async () => {
  const img = await decodePng(png(W, H, PALETTE, [0, 255, 255], pixels));
  assert.equal(img.width, W);
  assert.equal(img.height, H);
  const at = (x, y) => [...img.rgba.slice((y * W + x) * 4, (y * W + x) * 4 + 4)];
  assert.deepEqual(at(0, 0), [0, 0, 0, 0]);
  assert.deepEqual(at(5, 1), [255, 254, 232, 255]);
  assert.deepEqual(at(11, 6), [255, 255, 255, 255]);
});

test("DMVS: plochy obrázku, jejich obrysy a zjednodušení", async () => {
  const img = await decodePng(png(W, H, PALETTE, [0, 255, 255], pixels));
  const cls = classify(img, null);
  const { label, count, colour } = components(cls, W, H);
  assert.equal(count, 2);
  const road = label[4 * W + 5], walk = label[1 * W + 5];
  assert.ok(road >= 0 && walk >= 0 && road !== walk);
  assert.equal(colour[road], 0); // white: the type is asked
  assert.equal(label[0], -1); // blank stays blank
  // The roadway's outline: one ring around rows 4–6, a rectangle once simplified.
  const rings = trace(label, W, H, road);
  assert.equal(rings.length, 1);
  const ring = simplify(rings[0], 0.5);
  assert.equal(ring.length, 4);
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  assert.deepEqual([Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)], [0, W, 4, 7]);
});

test("DMVS: obrys plochy s dírou má dva kruhy", () => {
  // A 7 × 7 area with a 3 × 3 hole (another area inside).
  const w = 9, h = 9, label = new Int32Array(w * h).fill(-1);
  for (let y = 1; y < 8; y++) for (let x = 1; x < 8; x++) label[y * w + x] = 3 <= x && x <= 5 && 3 <= y && y <= 5 ? 1 : 0;
  const rings = trace(label, w, h, 0).map((r) => simplify(r, 0.1));
  assert.equal(rings.length, 2);
  assert.deepEqual(rings.map((r) => r.length).sort(), [4, 4]);
});

test("DMVS: názvy typů ploch → kódy MTVU", () => {
  assert.equal(typeCode("provozní plocha pozemní komunikace - komunikace"), 701);
  assert.equal(typeCode("plocha parkoviště, odstavné plochy"), 704);
  assert.equal(typeCode("plocha chodníku"), 702);
  assert.equal(typeCode("plocha nájezdu, sjezdu, vjezdu"), 702);
  assert.equal(typeCode("plocha přidružené plochy"), 701);
  assert.equal(typeCode("plocha dělícího pásu"), 401);
  assert.equal(typeCode("plocha budovy"), 601);
  assert.equal(typeCode("plocha zdi - opěrná zeď"), 602);
  assert.equal(typeCode("manipulační plocha"), 1003);
  assert.equal(typeCode("plocha zastřešení"), null); // a roof: the ground beneath decides
  assert.equal(typeCode("plocha příkopu, násypu, zářezu dopravní stavby"), 402);
});
