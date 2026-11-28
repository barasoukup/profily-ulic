// The player of the recording in Node (node.mjs, tests/cut-core.test.js): the page's address, its storage, a canvas and
// the page's Math (node-browser.mjs, cr-math.mjs), fetch over the recorded answers as harness.js gives them, then the
// core of a cut (app/public/app/cut-core.js) imported and each cut captured as harness.js captures the fields Node can
// make. One player per process: it sets the globals the app's modules read when they load.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { keyOf, readIndex, answerFor, toError } from "./recording.js";
import { useAddress, useCanvas, canvasStats } from "./node-browser.mjs";
import { useCorrectMath } from "./cr-math.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const PUBLIC = path.join(HERE, "..", "..", "app", "public");
const ORIGIN = "http://localhost:5190"; // the recording keys the app's own server by its path (SELF), any port will do
// The fields this player writes (compare.mjs compares only these against a run in the page).
export const FIELDS = ["status", "statusClass", "title", "city", "cut", "stav", "credits", "misses", "failed", "errors"];

// data: the folder of index.jsonl and bodies/; search: the page's address after its "?" (switches, language).
// onServe(entry): told of every recorded answer given (fixture.mjs keeps those of a few cuts for a test); canvases: false
// draws every canvas in Node (the recorded readbacks left out).
export async function startPlayer({ data, search, onServe = () => {}, canvases = true }) {
  useAddress(`${ORIGIN}/?${search}`);
  useCorrectMath(); // the page's engine rounds Math.sin, cos … correctly, Node's does not (cr-math.mjs)
  const index = readIndex(fs.readFileSync(path.join(data, "index.jsonl"), "utf8"));
  const served = new Map(), misses = [], notes = [];
  let cutId = null;
  const body = (e) => { const b = fs.readFileSync(path.join(data, "bodies", e.sha.slice(0, 2), e.sha)); return e.gz ? zlib.gunzipSync(b) : b; };
  useCanvas(canvases && ((key) => {
    const e = answerFor(index, served, cutId, key);
    if (e) onServe(e);
    return e && !e.error ? new Uint8ClampedArray(body(e)) : null;
  }));
  const isData = (u) => u.origin !== ORIGIN || u.pathname.startsWith("/api/") || u.pathname.startsWith("/data/");
  const own = (file) => (fs.existsSync(file) && fs.statSync(file).isFile() ? new Response(fs.readFileSync(file), { status: 200 }) : new Response("not found", { status: 404 }));
  globalThis.fetch = async (input, init = {}) => {
    const u = new URL(typeof input === "string" || input instanceof URL ? String(input) : input.url, location.href);
    // The app's own files from the disk (code, boundaries, texts, the model), the data from the recording.
    if (u.protocol === "file:") return own(decodeURIComponent(u.pathname));
    if (!isData(u)) return own(path.join(PUBLIC, decodeURIComponent(u.pathname)));
    const key = keyOf(u, init, ORIGIN), e = answerFor(index, served, cutId, key);
    if (!e) { misses.push(key); throw new TypeError("replay: not recorded"); }
    onServe(e);
    if (e.error) throw toError(e.error);
    const buf = body(e);
    if (init.signal?.aborted) throw init.signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
    return new Response(e.status === 204 || e.status === 304 ? null : buf, { status: e.status, statusText: e.statusText || "", headers: e.headers });
  };
  // Errors and the app's warnings, per cut (as harness.js: compare.mjs counts the uncaught ones).
  for (const k of ["error", "warn"]) {
    console[k] = (...a) => { notes.push(`${k}: ${a.map((x) => (x instanceof Error ? x.message : typeof x === "string" ? x : JSON.stringify(x))).join(" ").slice(0, 300)}`); };
  }
  process.on("uncaughtException", (e) => notes.push(`uncaught: ${e?.message}`));
  process.on("unhandledRejection", (e) => notes.push(`unhandled: ${e?.message || e}`));

  const { computeCut } = await import("../../app/public/app/cut-core.js");
  const { city } = await import("../../app/public/city.js");
  const { exportCredits } = await import("../../app/public/profile.js");
  const { streetName } = await import("../../app/public/app/state.js");
  const { t: tr } = await import("../../app/public/i18n.js");
  const { cleanProfile, cleanCut } = await import("../../app/public/validate.js");

  // The timer of the model's first download (cut-core.js AI_WAIT) does not keep Node running after the last cut.
  const wait = (ms) => new Promise((r) => setTimeout(r, ms).unref());
  // The page's state between cuts: a cut that finds no street leaves the one shown before, and that is the saved file
  // the page's replay loaded again after the cut before (harness.js capture: app/files.js restore, validate.js).
  let shown = null;
  function capture(p, done) {
    const out = { id: p.id, town: p.town, misses: [], notes: [] };
    out.status = done.status.text || "";
    out.statusClass = done.status.kind ? `muted ${done.status.kind}` : "muted";
    const now = done.cut ? JSON.parse(JSON.stringify({ cut: done.cut, stav: done.stav })) : shown;
    out.title = now ? streetName(now.cut) : null;
    out.city = JSON.parse(JSON.stringify(city));
    out.cut = now?.cut ?? null;
    out.stav = now?.stav ?? null;
    if (now) out.credits = exportCredits(now.cut?.sources);
    if (done.cut) {
      shown = JSON.parse(JSON.stringify(now));
      cleanProfile(shown.stav, tr("app.existing"));
      shown.cut = cleanCut(shown.cut);
    }
    return out;
  }
  // One cut of a sample (p: { id, lat, lon, town }), clicked as the page's replay clicks it; name: the cut in the recording.
  async function play(p, name) {
    cutId = name;
    const drawn = canvasStats.drawn;
    misses.length = 0; notes.length = 0;
    let out;
    try {
      let done;
      try {
        done = await computeCut({ lat: p.lat, lon: p.lon, shown: shown?.cut ?? null, navrhEdited: false }, { wait });
      } catch (err) {
        // The page's cutAt: the error on the status line, the cut shown before stays.
        notes.push(`error: ${err?.message}`);
        done = { status: { text: tr("app.dataCouldNotLoaded", { error: err.message }), kind: "error" } };
      }
      // What the cut started and did not wait for (a source asked after the profile) is its too, as harness.js settle().
      for (let quiet = 0; quiet < 30; quiet++) await new Promise((r) => setImmediate(r));
      out = capture(p, done);
    } catch (e) {
      out = { id: p.id, town: p.town, failed: String(e?.stack || e) };
    }
    out.misses = [...misses];
    out.notes = [...notes];
    // Readbacks the recording did not have (drawn in Node, close but not equal: README "Přehrávka v Node"); not compared.
    if (canvasStats.drawn > drawn) out.canvasDrawn = canvasStats.drawn - drawn;
    return out;
  }
  return { play, canvasStats };
}
