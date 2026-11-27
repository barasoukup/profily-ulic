// Reading a packed OSM file (tools/pack_osm_tiles.mjs, osmpack.js) whole from disk, tile by tile, back into the
// lines of osmtile.js ({ t, i, k, g, o, h, q }), so that a pack can be measured, filtered and packed again without the
// PBF it was built from (evaluation/osm-r2/slim).
import fs from "node:fs";
import zlib from "node:zlib";
import { MAGIC, VERSION } from "../../../pilot/public/osmpack.js";

export function readHead(buf) {
  if (buf.toString("ascii", 0, 4) !== MAGIC) throw new Error("není soubor dlaždic OSM");
  if (buf.readUInt32LE(4) !== VERSION) throw new Error("jiná verze");
  const len = buf.readUInt32LE(8);
  const head = JSON.parse(zlib.gunzipSync(buf.subarray(12, 12 + len)));
  head.base = 12 + len;
  return head;
}

// Every tile of the pack: yields { name, ix, iy, gz (its gzip bytes), lines (osmtile.js elements) }.
export function* tilesOf(file) {
  const buf = fs.readFileSync(file);
  const head = readHead(buf), B = head.block;
  for (const [bx, by, leafAt, leafLen, dataAt] of head.blocks) {
    const lengths = new Uint32Array(new Uint8Array(zlib.gunzipSync(buf.subarray(head.base + leafAt, head.base + leafAt + leafLen))).buffer);
    let at = head.base + dataAt;
    for (let i = 0; i < B * B; i++) {
      const n = lengths[i];
      if (!n) continue;
      const ix = bx * B + (i % B), iy = by * B + Math.floor(i / B);
      const gz = buf.subarray(at, at + n);
      at += n;
      const arr = JSON.parse(zlib.gunzipSync(gz));
      const lines = arr.map(([type, id, tagList, g = [], o, h]) => {
        const q5 = type === 3, step = q5 ? 500 : 5000;
        const k = {};
        for (let j = 0; j < tagList.length; j++) {
          const t = tagList[j];
          if (typeof t === "number" && t >= 0) { const [ki, v] = head.pairs[t]; k[head.keys[ki]] = v; }
          else k[typeof t === "number" ? head.keys[-1 - t] : t] = tagList[++j];
        }
        const gg = [...g];
        if (gg.length) { gg[0] += ix * step; gg[1] += iy * step; }
        const el = { t: ["w", "a", "n", "a"][type], i: id, k, g: gg };
        if (o !== undefined && o !== null) el.o = o;
        if (h) el.h = h;
        if (q5) el.q = 5;
        return el;
      });
      yield { name: `${ix}_${iy}`, ix, iy, gz, arr, lines, head };
    }
  }
}
