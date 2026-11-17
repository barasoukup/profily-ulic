// Packs a folder of OSM tiles (tools/build_osm_tiles.mjs, the form of osmtile.js) into one file per country
// in the shorter form of pilot/public/osmpack.js (a dictionary of tags, shorter elements, each tile gzipped,
// a two-level index), for the web: Cloudflare R2 and, as a fallback, Pages (gis.js). The folder stays as it is.
//   node tools/pack_osm_tiles.mjs pilot/data/osm-tiles pilot/data/osm-pack/cz-2026-11-16-{hash}.posm
// and writes the file's name into index.json beside it (the key "cz": the name up to "-" or ".").
// The file is a database derived from OpenStreetMap: © OpenStreetMap contributors, ODbL 1.0.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { TILE } from "../pilot/public/osmtile.js";
import { MAGIC, VERSION, encodeElement } from "../pilot/public/osmpack.js";

export const BLOCK = 32; // tiles a side of a block: 0,16° (about 11 × 18 km), a leaf of 4 kB before gzip
// A pair key=value goes to the dictionary when it is in at least MIN_PAIR elements, a key when in MIN_KEY.
// Names stay in the tiles (unique, and the dictionary is read whole at the start).
const MIN_PAIR = 30, MIN_KEY = 10;
const NAMES = /(^|_)name(:|$)/;

// Packs tiles: names ("ix_iy"), text(name) → the tile as osmtile.js has it. Returns the file (Buffer) and a summary.
export function packTiles(names, text, { source = "", minPair = MIN_PAIR, minKey = MIN_KEY } = {}) {
  const lines = (n) => text(n).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  // 1. How often each key and pair is.
  const pairN = new Map(), keyN = new Map();
  for (const f of names) {
    for (const e of lines(f)) {
      for (const [k, v] of Object.entries(e.k || {})) {
        keyN.set(k, (keyN.get(k) || 0) + 1);
        if (NAMES.test(k)) continue;
        const p = `${k}\u0000${v}`;
        pairN.set(p, (pairN.get(p) || 0) + 1);
      }
    }
  }
  const keys = [...keyN].filter(([, n]) => n >= minKey).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const keyIx = new Map(keys.map((k, i) => [k, i]));
  const pairsStr = [...pairN].filter(([p, n]) => n >= minPair && keyIx.has(p.split("\u0000")[0])).sort((a, b) => b[1] - a[1]).map(([p]) => p);
  const pairIx = new Map(pairsStr.map((p, i) => [p, i]));
  const pairs = pairsStr.map((p) => { const [k, v] = p.split("\u0000"); return [keyIx.get(k), v]; });
  const dict = { pair: (k, v) => pairIx.get(`${k}\u0000${v}`), key: (k) => keyIx.get(k) };

  // 2. Blocks: the leaf and the tiles of each, in order.
  const byBlock = new Map();
  const extent = { ix: [Infinity, -Infinity], iy: [Infinity, -Infinity] };
  for (const f of names) {
    const [ix, iy] = f.split("_").map(Number);
    const key = `${Math.floor(ix / BLOCK)}_${Math.floor(iy / BLOCK)}`;
    if (!byBlock.has(key)) byBlock.set(key, []);
    byBlock.get(key).push([ix, iy, f]);
    extent.ix = [Math.min(extent.ix[0], ix), Math.max(extent.ix[1], ix)];
    extent.iy = [Math.min(extent.iy[0], iy), Math.max(extent.iy[1], iy)];
  }
  const chunks = [], blocks = [];
  let at = 0, raw = 0, json = 0;
  const blockKeys = [...byBlock.keys()].map((k) => k.split("_").map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  for (const [bx, by] of blockKeys) {
    const cells = new Map(byBlock.get(`${bx}_${by}`).map(([ix, iy, f]) => [(iy - by * BLOCK) * BLOCK + (ix - bx * BLOCK), [ix, iy, f]]));
    const lengths = new Uint32Array(BLOCK * BLOCK), tiles = [];
    for (let i = 0; i < BLOCK * BLOCK; i++) {
      if (!cells.has(i)) continue;
      const [ix, iy, f] = cells.get(i);
      raw += Buffer.byteLength(text(f));
      const s = JSON.stringify(lines(f).map((e) => encodeElement(e, dict, ix, iy)));
      json += s.length;
      const gz = zlib.gzipSync(s, { level: 9 });
      lengths[i] = gz.length;
      tiles.push(gz);
    }
    const leaf = zlib.gzipSync(Buffer.from(lengths.buffer), { level: 9 });
    const dataAt = at + leaf.length, dataLen = tiles.reduce((s, b) => s + b.length, 0);
    blocks.push([bx, by, at, leaf.length, dataAt, dataLen]);
    chunks.push(leaf, ...tiles);
    at = dataAt + dataLen;
  }

  const head = zlib.gzipSync(JSON.stringify({
    v: VERSION, tile: TILE, block: BLOCK, extent, tiles: names.length, created: new Date().toISOString(),
    source, attribution: "© OpenStreetMap contributors, ODbL 1.0",
    keys, pairs, blocks,
  }), { level: 9 });
  const pre = Buffer.alloc(12);
  pre.write(MAGIC, 0, "ascii");
  pre.writeUInt32LE(VERSION, 4);
  pre.writeUInt32LE(head.length, 8);
  return { file: Buffer.concat([pre, head, ...chunks]), tiles: names.length, blocks: blocks.length, keys: keys.length, pairs: pairs.length, raw, json, head: head.length };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [dir, outArg] = process.argv.slice(2);
  if (!dir || !outArg) {
    console.error("node tools/pack_osm_tiles.mjs <složka dlaždic> <soubor.posm>");
    process.exit(1);
  }
  const names = fs.readdirSync(dir).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).map((f) => f.slice(0, -5));
  const r = packTiles(names, (n) => fs.readFileSync(path.join(dir, `${n}.json`), "utf8"), { source: path.basename(dir) });
  // "{hash}" in the name becomes the start of the file's SHA-256: a rebuilt file never takes the name of another.
  const out = outArg.replace("{hash}", crypto.createHash("sha256").update(r.file).digest("hex").slice(0, 10));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, r.file);
  // index.json beside it names the file of each country (the part of the name before "-" or "."; osmpack.js PackSet).
  const indexFile = path.join(path.dirname(out), "index.json");
  let index = { files: {} };
  try { index = JSON.parse(fs.readFileSync(indexFile, "utf8")); } catch {}
  const key = path.basename(out).split(/[-.]/)[0];
  index.files[key] = path.basename(out);
  // The box of its tiles ([ix0, iy0, ix1, iy1], tile indices): the app opens only the files whose box holds the tiles of
  // a cut (osmpack.js PackSet; the review of Germany: every cut opened the head of every file).
  const ij = names.map((n) => n.split("_").map(Number));
  (index.bbox ??= {})[key] = [Math.min(...ij.map((p) => p[0])), Math.min(...ij.map((p) => p[1])), Math.max(...ij.map((p) => p[0])), Math.max(...ij.map((p) => p[1]))];
  index.attribution = "© OpenStreetMap contributors, ODbL 1.0";
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 1) + "\n");
  const mb = (n) => (n / 1e6).toFixed(1) + " MB";
  console.log(`${r.tiles} dlaždic, ${r.blocks} bloků, slovník ${r.keys} klíčů a ${r.pairs} dvojic`);
  console.log(`dnes ${mb(r.raw)} → krátký zápis ${mb(r.json)} → ${out} ${mb(r.file.length)} (hlava ${(r.head / 1e3).toFixed(0)} kB)`);
}
