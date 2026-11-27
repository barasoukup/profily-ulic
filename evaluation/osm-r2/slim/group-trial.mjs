// What compressing neighbouring tiles together would save (evaluation/osm-r2/slim): raw deflate of each tile alone,
// of pairs of tiles along x, and of 2 × 2 tiles, against the gzip of each tile in the file.
//   node evaluation/osm-r2/slim/group-trial.mjs pack.posm
import zlib from "node:zlib";
import { tilesOf } from "./posm.mjs";

const [file] = process.argv.slice(2);
const by2 = new Map(), by4 = new Map();
let now = 0, one = 0;
for (const { ix, iy, gz, arr } of tilesOf(file)) {
  now += gz.length;
  const s = JSON.stringify(arr);
  one += zlib.deflateRawSync(s, { level: 9 }).length;
  const k2 = `${ix >> 1}_${iy}`, k4 = `${ix >> 1}_${iy >> 1}`;
  by2.set(k2, (by2.get(k2) || "") + s);
  by4.set(k4, (by4.get(k4) || "") + s);
}
const sz = (m) => { let n = 0; for (const s of m.values()) n += zlib.deflateRawSync(s, { level: 9 }).length; return n; };
const two = sz(by2), four = sz(by4);
const pc = (x) => `${(x / 1e6).toFixed(1)} MB (${((100 * x) / now).toFixed(1)} %)`;
console.log(`${file}: gzip a tile ${pc(now)}; deflate-raw a tile ${pc(one)}, two tiles ${pc(two)}, 2 × 2 tiles ${pc(four)}`);
