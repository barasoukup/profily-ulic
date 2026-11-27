// What a second version of the pack format would save (evaluation/osm-r2/slim), tile by tile on a pack: the same
// elements with each id as the difference from the id before it in the tile, and/or raw deflate in place of gzip (no
// 18 bytes of gzip's header and trailer a tile).
//   node evaluation/osm-r2/slim/format-trial.mjs pack.posm
import zlib from "node:zlib";
import { tilesOf } from "./posm.mjs";

const [file] = process.argv.slice(2);
const sum = { now: 0, gz: 0, raw: 0, delta: 0, both: 0 };
let tiles = 0;
for (const { gz, arr } of tilesOf(file)) {
  tiles++;
  sum.now += gz.length;
  const s = JSON.stringify(arr);
  sum.gz += zlib.gzipSync(s, { level: 9 }).length;
  sum.raw += zlib.deflateRawSync(s, { level: 9 }).length;
  let prev = 0;
  const d = arr.map((a) => { const b = [...a]; b[1] = a[1] - prev; prev = a[1]; return b; });
  const sd = JSON.stringify(d);
  sum.delta += zlib.gzipSync(sd, { level: 9 }).length;
  sum.both += zlib.deflateRawSync(sd, { level: 9 }).length;
}
const mb = (x) => (x / 1e6).toFixed(1);
console.log(`${file}: ${tiles} tiles; gzip in the file ${mb(sum.now)} MB, gzip here ${mb(sum.gz)}, deflate-raw ${mb(sum.raw)} (${(100 * sum.raw / sum.now).toFixed(1)} %), id deltas ${mb(sum.delta)} (${(100 * sum.delta / sum.now).toFixed(1)} %), both ${mb(sum.both)} (${(100 * sum.both / sum.now).toFixed(1)} %)`);
