// The replay in Node (code-health plan, step 13b, 28. 11. 2026): every cut of a sample made by the core of a cut
// (app/public/app/cut-core.js computeCut) over the recorded answers, as harness.js makes it in the page, without a
// browser (node-player.mjs). What the page alone makes (the drawings and their export, the Návrh's editors and palette,
// the saved file loaded again) is not written: compare.mjs compares only the fields this run has (README "Přehrávka v Node").
//   node evaluation/replay/node.mjs <sample> <run> [--jobs=N] [--canvas=draw] [--lang=cs] [--from=N --to=N] [--switches='wien=0&off=mapfill']
//   node evaluation/replay/compare.mjs <run in the page> <run>
// --jobs=N: N processes, each a stretch of the sample; each first makes the cut before its stretch unwritten (a click
// near the cut shown is placed differently, cut-core.js AGAIN_M), so the cuts come out as in one process. --canvas=draw:
// every canvas drawn in Node, none of the recorded readbacks (README "Přehrávka v Node": how close that is).
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { DATA, OUT } from "./paths.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2), opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const [SAMPLE = "sample", RUN = `node-${SAMPLE}`] = args.filter((a) => !a.startsWith("--"));
const LANG = opt("lang") || "cs", FROM = Number(opt("from") ?? 0), TO = Number(opt("to") ?? Infinity), JOBS = Number(opt("jobs") || 1);
const PART = opt("part"); // "k/N": one of the processes of --jobs
// The page's address as the replay in the page has it (?osm=balik: the packed OSM tiles that were recorded).
const SEARCH = `replay=play&run=${RUN}&sample=${SAMPLE}&lang=${LANG}&osm=balik${opt("switches") ? "&" + opt("switches") : ""}`;
const all = JSON.parse(fs.readFileSync(path.join(HERE, `${SAMPLE}.json`), "utf8"));
const chosen = all.filter((p) => p.id >= FROM && p.id <= TO);
const dir = path.join(OUT, RUN);
fs.mkdirSync(dir, { recursive: true });
const t0 = Date.now();

if (JOBS > 1 && !PART) {
  // The parent: the processes, then what they did together.
  const own = args.filter((a) => !a.startsWith("--jobs="));
  const codes = await Promise.all(Array.from({ length: JOBS }, (_, k) => new Promise((ok) => {
    spawn(process.execPath, [new URL(import.meta.url).pathname, ...own, `--part=${k}/${JOBS}`], { stdio: ["ignore", "ignore", "inherit"] }).on("exit", ok);
  })));
  const parts = Array.from({ length: JOBS }, (_, k) => JSON.parse(fs.readFileSync(path.join(dir, `_part${k}.json`), "utf8")));
  parts.forEach((_, k) => fs.rmSync(path.join(dir, `_part${k}.json`)));
  finish(chosen.length, parts.reduce((a, p) => a + p.recorded, 0), parts.reduce((a, p) => a + p.drawn, 0), parts[0].fields);
  process.exit(codes.some(Boolean) ? 1 : 0);
}

const { startPlayer, FIELDS } = await import("./node-player.mjs");
const { play, canvasStats } = await startPlayer({ data: DATA, search: SEARCH, canvases: opt("canvas") !== "draw" });
const name = (p) => p.rec || `${SAMPLE}:${p.id}`; // p.rec: the cut as another recording named it (sample-states.json)
let stretch = chosen;
if (PART) {
  const [k, n] = PART.split("/").map(Number), size = Math.ceil(chosen.length / n);
  stretch = chosen.slice(k * size, (k + 1) * size);
  const before = all[all.indexOf(stretch[0]) - 1];
  if (before) await play(before, name(before));
}
for (const [n, p] of stretch.entries()) {
  const out = await play(p, name(p));
  fs.writeFileSync(path.join(dir, `${p.id}.json`), JSON.stringify(out));
  if (process.stdout.isTTY) process.stdout.write(`\r${n + 1}/${stretch.length} ${p.id}   `);
}
if (PART) {
  fs.writeFileSync(path.join(dir, `_part${PART.split("/")[0]}.json`), JSON.stringify({ ...canvasStats, fields: FIELDS }));
  process.exit(0);
}
finish(stretch.length, canvasStats.recorded, canvasStats.drawn, FIELDS);
process.exit(0);

function finish(cuts, recorded, drawn, fields) {
  const progress = `done ${cuts} in ${Math.round((Date.now() - t0) / 1000)} s${JOBS > 1 ? ` (${JOBS} processes)` : ""}`;
  // The canvases' readbacks: given back from the recording (?replay=canvas in the page) or drawn here (close, not equal).
  const canvas = `canvas: ${recorded} recorded, ${drawn} drawn in Node`;
  fs.writeFileSync(path.join(dir, "_done.json"), JSON.stringify({ progress, canvas, mode: "node", sample: SAMPLE, lang: LANG, search: `?${SEARCH}`, fields }));
  process.stdout.write(`\n${RUN}: ${progress}, ${canvas}\n`);
}
