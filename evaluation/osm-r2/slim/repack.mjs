// A packed OSM file packed again, slimmed or not (tools/osm_slim.mjs), to measure what each rule saves and to make the
// slim packs of the local samples without the PBF they were built from: every tile decoded (posm.mjs), then packed as
// tools/pack_osm_tiles.mjs packs a folder of tiles.
//   node --max-old-space-size=12000 evaluation/osm-r2/slim/repack.mjs in.posm out.posm [all|none|ids,tags]
import fs from "node:fs";
import { tilesOf } from "./posm.mjs";
import { packTiles } from "../../../tools/pack_osm_tiles.mjs";
import { RULES } from "../../../tools/osm_slim.mjs";

const [inFile, outFile, rulesArg = "all"] = process.argv.slice(2);
const slim = rulesArg === "all" ? RULES : rulesArg === "none" ? [] : rulesArg.split(",");
const t0 = Date.now();
const text = new Map();
for (const { name, lines } of tilesOf(inFile)) text.set(name, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
const r = packTiles([...text.keys()], (n) => text.get(n), { source: "repack", slim });
fs.writeFileSync(outFile, r.file);
const mb = (x) => (x / 1e6).toFixed(2), was = fs.statSync(inFile).size;
console.log(`${inFile} ${mb(was)} MB → ${outFile} ${mb(r.file.length)} MB (${((100 * r.file.length) / was).toFixed(1)} %) slim=${slim.join(",") || "none"} ${JSON.stringify(r.stats)} ${((Date.now() - t0) / 1000).toFixed(0)} s`);
