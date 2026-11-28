// The replay in Node (code-health plan, step 13b, 28. 11. 2026): every cut of a sample made by the core of a cut
// (app/public/app/cut-core.js computeCut) over the recorded answers, as harness.js makes it in the page, without a
// browser (node-player.mjs). What the page alone makes (the drawings and their export, the Návrh's editors and palette,
// the saved file loaded again) is not written: compare.mjs compares only the fields this run has (README "Přehrávka v Node").
//   node evaluation/replay/node.mjs <sample> <run> [--lang=cs] [--from=N --to=N] [--switches='wien=0&off=mapfill']
//   node evaluation/replay/compare.mjs <run in the page> <run>
import fs from "node:fs";
import path from "node:path";
import { DATA, OUT } from "./paths.mjs";
import { startPlayer, FIELDS } from "./node-player.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2), opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const [SAMPLE = "sample", RUN = `node-${SAMPLE}`] = args.filter((a) => !a.startsWith("--"));
const LANG = opt("lang") || "cs", FROM = Number(opt("from") ?? 0), TO = Number(opt("to") ?? Infinity);
// The page's address as the replay in the page has it (?osm=balik: the packed OSM tiles that were recorded).
const SEARCH = `replay=play&run=${RUN}&sample=${SAMPLE}&lang=${LANG}&osm=balik${opt("switches") ? "&" + opt("switches") : ""}`;
const { play, canvasStats } = await startPlayer({ data: DATA, search: SEARCH });

const sample = JSON.parse(fs.readFileSync(path.join(HERE, `${SAMPLE}.json`), "utf8")).filter((p) => p.id >= FROM && p.id <= TO);
const dir = path.join(OUT, RUN);
fs.mkdirSync(dir, { recursive: true });
const t0 = Date.now();
for (const [n, p] of sample.entries()) {
  const out = await play(p, p.rec || `${SAMPLE}:${p.id}`); // p.rec: the cut as another recording named it (sample-states.json)
  fs.writeFileSync(path.join(dir, `${p.id}.json`), JSON.stringify(out));
  if (process.stdout.isTTY) process.stdout.write(`\r${n + 1}/${sample.length} ${p.id}   `);
}
const progress = `done ${sample.length} in ${Math.round((Date.now() - t0) / 1000)} s`;
// The canvases' readbacks: given back from the recording (?replay=canvas in the page) or drawn here (close, not equal).
const canvas = `canvas: ${canvasStats.recorded} recorded, ${canvasStats.drawn} drawn in Node`;
fs.writeFileSync(path.join(dir, "_done.json"), JSON.stringify({ progress, canvas, mode: "node", sample: SAMPLE, lang: LANG, search: `?${SEARCH}`, fields: FIELDS }));
process.stdout.write(`\n${RUN}: ${progress}, ${canvas}\n`);
process.exit(0);
