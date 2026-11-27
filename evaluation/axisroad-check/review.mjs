// The changed cuts of the check of ?axisroad=1 (REPORT.md) for a look: the orthophoto across each cut (the universal
// measurement's evaluation/universal/ortho.mjs, the state's own orthophoto, Esri World Imagery in North America and where the
// state has none there), A on the left, B on the right as in the profile.
//   node evaluation/axisroad-check/review.mjs data/changed-<set>.json  → data/review/<set>-<id>.jpg
import fs from "node:fs";
import path from "node:path";
import { orthoImage } from "../universal/ortho.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const file = path.resolve(process.argv[2]), set = path.basename(file, ".json").replace(/^changed-/, "");
const { changed } = JSON.parse(fs.readFileSync(file, "utf8"));
fs.mkdirSync(path.join(HERE, "data", "review"), { recursive: true });
for (const c of changed) {
  const out = path.join(HERE, "data", "review", `${set}-${c.id}.jpg`);
  if (fs.existsSync(out)) continue;
  try { await orthoImage({ lat: c.lat, lon: c.lon, bearing: c.bearing, country: c.country, half: 30 }, out); console.log(out); }
  catch (e) { console.log(`${c.id}: ${e.message}`); }
}
