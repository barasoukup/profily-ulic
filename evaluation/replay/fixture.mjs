// A few cuts of a sample with all the recorded answers they need, for tests/cut-core.test.js: the index entries and
// bodies they were given and what the player made of them (expected.json); the canvases drawn in Node (a recorded
// readback of the AI's photo is half a megabyte: the test checks the core, the page's run checks the canvases).
//   node evaluation/replay/fixture.mjs <sample> <id,id,…> <folder> [switches, e.g. ai=0]
import fs from "node:fs";
import path from "node:path";
import { DATA } from "./paths.mjs";
import { startPlayer } from "./node-player.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const [SAMPLE, IDS, DIR, SWITCHES = ""] = process.argv.slice(2);
const ids = IDS.split(",").map(Number);
const used = new Map();
const { play } = await startPlayer({ data: DATA, search: `lang=cs&osm=balik${SWITCHES ? "&" + SWITCHES : ""}`, onServe: (e) => used.set(`${e.key}|${e.cut}|${e.sha}`, e), canvases: false });
const points = JSON.parse(fs.readFileSync(path.join(HERE, `${SAMPLE}.json`), "utf8")).filter((p) => ids.includes(p.id));
const expected = [];
for (const p of points) expected.push({ point: { id: p.id, lat: p.lat, lon: p.lon, town: p.town }, name: p.rec || `${SAMPLE}:${p.id}`, out: await play(p, p.rec || `${SAMPLE}:${p.id}`) });
fs.mkdirSync(path.join(DIR, "bodies"), { recursive: true });
// The entries as they were given (a cut's answers of one request in the order of the index).
const keep = [...used.values()].map((e) => JSON.stringify(e));
fs.writeFileSync(path.join(DIR, "index.jsonl"), keep.join("\n") + "\n");
for (const e of used.values()) {
  if (!e.sha) continue;
  fs.mkdirSync(path.join(DIR, "bodies", e.sha.slice(0, 2)), { recursive: true });
  fs.copyFileSync(path.join(DATA, "bodies", e.sha.slice(0, 2), e.sha), path.join(DIR, "bodies", e.sha.slice(0, 2), e.sha));
}
fs.writeFileSync(path.join(DIR, "expected.json"), JSON.stringify(expected, null, 1));
console.log(`${points.length} cuts, ${keep.length} answers`);
process.exit(0);
