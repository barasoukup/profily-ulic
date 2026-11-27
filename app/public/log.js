// What visitors do, sent to the Worker of logging/ (Cloudflare, Bára): each cut exactly (there is nothing
// personal in it) and a few actions. navigator.sendBeacon as text: no preflight, the page never waits, and a
// failure changes nothing. Without LOG_URL (config.js, filled by the deploy from the repository variable)
// nothing is sent, so a local run logs nothing.
import { LOG_URL } from "./config.js";

const SESSION = globalThis.crypto?.randomUUID?.() || String(Math.random()).slice(2); // one page load, never stored

// Whether anything is logged at all (the report button shows only then, so it never thanks for nothing).
export const logOn = !!LOG_URL;

// A report the visitor waits for: a plain POST whose answer is read (the Worker allows our origin), so a failure
// can be told. Text, so the browser sends no preflight. Resolves to true when the Worker kept it.
export async function sendReport(kind, data = {}) {
  if (!LOG_URL) return false;
  try {
    const r = await fetch(LOG_URL, { method: "POST", body: JSON.stringify({ kind, session: SESSION, ...data }), headers: { "Content-Type": "text/plain" }, signal: AbortSignal.timeout(10000) });
    return r.ok;
  } catch {
    return false;
  }
}

export function log(kind, data = {}) {
  if (!LOG_URL) return;
  try {
    const body = JSON.stringify({ kind, session: SESSION, ...data });
    if (!navigator.sendBeacon?.(LOG_URL, new Blob([body], { type: "text/plain" }))) {
      fetch(LOG_URL, { method: "POST", body, keepalive: true, mode: "no-cors" }).catch(() => {});
    }
  } catch {}
}

// A profile in short, for the log of edits: per part its type and width, and what else tells it apart
// (direction, cyclists, parking orientation and position, tram bed, turn arrows, signs); the edges' kinds.
// Furniture and buildings' looks are left out, so a record stays a few hundred bytes.
const SIGN = (g) => g.k + (g.v ? ":" + g.v : "") + (g.plate ? "+" + g.plate : "");
export function shortProfile(p) {
  if (!p) return null;
  return {
    l: p.edges?.left || null,
    r: p.edges?.right || null,
    s: p.segments.map((x) => {
      const o = { t: x.type, w: +(+x.width).toFixed(2) };
      for (const [k, f] of [["d", "dir"], ["b", "bikeDir"], ["o", "orient"], ["p", "position"], ["e", "bed"], ["n", "turn"]]) if (x[f]) o[k] = x[f];
      if (x.signs?.length) o.z = x.signs.map(SIGN);
      return o;
    }),
  };
}
