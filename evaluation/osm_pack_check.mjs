// Checks a packed country file (tools/pack_osm_tiles.mjs) against the tiles it was made of: every tile must
// decode to the same elements (osmtile.js decodeTile = osmpack.js Pack). Then the OSM answer of the cuts of
// evaluation/data/samples.json (as osmTiles in gis.js: tiles around the point, lines joined), old vs. pack.
// The pack is read from disk or, with a URL (R2), over HTTP Range.
//   node evaluation/osm_pack_check.mjs pilot/data/osm-tiles data/osm-pack/cz.posm [samples.json …] [--all]
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { TILE, decodeTile, mergePieces } from "../pilot/public/osmtile.js";
import { Pack, rangeFetch } from "../pilot/public/osmpack.js";

const [dir, file, ...samplesFiles] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ALL = process.argv.includes("--all");

let requests = 0, bytes = 0;
const fileRead = (f) => {
  const fd = fs.openSync(f, "r");
  return async (start, end) => {
    const b = Buffer.alloc(end - start + 1);
    const n = fs.readSync(fd, b, 0, b.length, start);
    requests++; bytes += n;
    return { bytes: new Uint8Array(b.buffer, b.byteOffset, n) };
  };
};
const read = /^https?:/.test(file) ? (() => { const f = rangeFetch(file); return async (s, e) => { const r = await f(s, e); requests++; bytes += r.bytes.length; return r; }; })() : fileRead(file);
const pack = new Pack(read);
const old = (n) => { try { return decodeTile(fs.readFileSync(path.join(dir, `${n}.json`), "utf8")); } catch { return []; } };

let bad = 0;
if (ALL) {
  const names = fs.readdirSync(dir).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).map((f) => f.slice(0, -5));
  for (let i = 0; i < names.length; i += 500) {
    const part = names.slice(i, i + 500);
    const got = await pack.tiles(part);
    part.forEach((n, j) => { if (!isDeepStrictEqual(got[j], old(n))) { bad++; if (bad < 5) console.log("jiná dlaždice", n); } });
  }
  console.log(`dlaždice: ${names.length - bad} z ${names.length} stejné`);
}

const around = (lat, lon, radius) => {
  const dLat = radius / 110574, dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180)), names = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++) {
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) names.push(`${ix}_${iy}`);
  }
  return names;
};
if (samplesFiles.length) {
  const samples = samplesFiles.flatMap((f) => { const j = JSON.parse(fs.readFileSync(f, "utf8")); return Array.isArray(j) ? j : j.samples; });
  let same = 0, els = 0;
  const t0 = performance.now();
  for (const s of samples) {
    const lat = s.lat ?? s.point?.[0], lon = s.lon ?? s.point?.[1];
    const names = around(lat, lon, 80);
    const a = mergePieces(names.map(old)), b = mergePieces(await pack.tiles(names));
    if (isDeepStrictEqual(a, b)) same++; else console.log("jiný řez", s.id ?? "", lat, lon);
    els += a.length;
  }
  console.log(`řezy: ${same} z ${samples.length} stejné (${els} prvků OSM), ${requests} čtení, ${(bytes / 1e6).toFixed(2)} MB, ${((performance.now() - t0) / samples.length).toFixed(0)} ms na řez`);
  if (same < samples.length) bad++;
}
process.exit(bad ? 1 : 0);
