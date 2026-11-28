// Collecting the profiles of cuts in Node (code-health plan, step 19): a wrapper over the player of the replay
// (evaluation/replay/node-player.mjs, 13b), which plays the core of a cut (app/public/app/cut-core.js) over a recording of
// the services' answers. No browser, no request to a service: a cut the recording does not have ends in `misses`.
//   const { cuts } = await collect({ cuts: loadSample("sample-cz"), switches: "off=mapfill" });
// One player per process (it sets the globals the app's modules read when they load), so one collect() per process and
// one set of switches; to compare two variants run two processes (collectRun below) or use the switches of the page's address.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { startPlayer, FIELDS } from "../replay/node-player.mjs";
import { DATA, OUT } from "../replay/paths.mjs";

export { FIELDS, DATA, OUT };
const HERE = path.dirname(new URL(import.meta.url).pathname);

// cuts: points { id, lat, lon, town, name } (loadSample gives them; `name` is the cut in the recording) in the order they are
// played (a cut remembers the one before it: cut-core.js AGAIN_M, README of the replay). switches: the page's address after
// the language, as the browser has it ("off=mapfill&wien=0"). canvases: false draws every canvas in Node.
// Returns [{ cut, out }] with `out` as the player writes it (status, title, city, cut, stav, credits, misses, notes …).
export async function collect({ cuts, switches = "", lang = "cs", data = DATA, canvases = true, onCut = () => {} }) {
  const { play, canvasStats } = await startPlayer({ data, search: `lang=${lang}&osm=balik${switches ? "&" + switches : ""}`, canvases });
  const out = [];
  for (const [i, cut] of cuts.entries()) {
    const o = JSON.parse(JSON.stringify(await play(cut, cut.name || cut.rec || `${cut.sample}:${cut.id}`)));
    out.push({ cut, out: o });
    onCut(cut, o, i);
  }
  return { cuts: out, canvasStats };
}

// What a compare of two runs looks at: the fields the player writes (not the notes, which name timings).
export const fieldsOf = (out) => Object.fromEntries(FIELDS.filter((k) => k in out).map((k) => [k, out[k]]));
// Keys in order, so that two objects with the same content have the same text.
export const canonical = (v) => (Array.isArray(v) ? v.map(canonical) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v);
export const hash = (v) => crypto.createHash("sha1").update(JSON.stringify(canonical(v))).digest("hex").slice(0, 10);

// The parts of the profile A→B as one line ("pruh 3.5 · chodnik 2.1"), for a person to see what changed.
export const partsLine = (out) => (out?.stav?.segments || []).map((s) => `${s.type} ${+s.width.toFixed(2)}`).join(" · ");

// A whole sample in several processes and the files compare.mjs reads (replay/node.mjs): the run's folder in OUT.
// Returns when it is done. For the cuts of a sample that is already recorded; a few cuts: collect().
export function collectRun({ sample, run, jobs = 8, switches = "", lang = "cs", from, to, canvas }) {
  const args = [path.join(HERE, "..", "replay", "node.mjs"), sample, run, `--jobs=${jobs}`, `--lang=${lang}`];
  if (switches) args.push(`--switches=${switches}`);
  if (from != null) args.push(`--from=${from}`);
  if (to != null) args.push(`--to=${to}`);
  if (canvas) args.push(`--canvas=${canvas}`);
  return new Promise((ok, no) => spawn(process.execPath, args, { stdio: "inherit" }).on("exit", (c) => (c ? no(new Error(`node.mjs ended with ${c}`)) : ok(path.join(OUT, run)))));
}
// The outputs of a run in OUT (written by node.mjs or the page's replay), by id.
export function readRun(run) {
  const dir = path.join(OUT, run), res = new Map();
  for (const f of fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f))) res.set(+f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  return res;
}
