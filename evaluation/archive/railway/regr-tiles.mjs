// The OSM tiles of Prague and Brno for the regression (evaluation/ortho-osm/regression.mjs, OSM_TILES=<out>): the app's
// tiles of app/data/osm-tiles, with the railway lines the new build keeps (tiles-CZ of build.sh, over the BBBike
// extracts of Prague and Brno) added to them; tiles without a railway are links.
//   node evaluation/archive/railway/regr-tiles.mjs <tiles-CZ folder> <out folder>
import fs from "node:fs";
import path from "node:path";
const [src, out] = process.argv.slice(2);
const MAIN = new URL("../../../app/data/osm-tiles/", import.meta.url).pathname;
const KIND = /"railway":"(rail|narrow_gauge|subway)"/;
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
let withRail = 0, n = 0;
for (const f of fs.readdirSync(src).filter((f) => /^-?\d+_-?\d+\.json$/.test(f))) {
  const rails = fs.readFileSync(path.join(src, f), "utf8").split("\n").filter((l) => l && KIND.test(l));
  const mine = path.join(MAIN, f);
  if (!fs.existsSync(mine)) continue;
  n++;
  if (!rails.length) { fs.symlinkSync(fs.realpathSync(mine), path.join(out, f)); continue; }
  fs.writeFileSync(path.join(out, f), fs.readFileSync(mine, "utf8").replace(/\n?$/, "\n") + rails.join("\n") + "\n");
  withRail++;
}
console.log(`${n} tiles, ${withRail} with railway lines`);
