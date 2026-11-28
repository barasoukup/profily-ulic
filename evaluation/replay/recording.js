// The recording of the sources' answers, as both players read it: the page's (harness.js, served by server.mjs) and
// Node's (node.mjs). A request's key, the index of the answers by key, and which answer a request of a cut gets.

// A request's header (fetch's init: a Headers or a plain object).
const headerOf = (init, name) => {
  const h = init?.headers;
  if (!h) return null;
  if (typeof Headers !== "undefined" && h instanceof Headers) return h.get(name);
  const k = Object.keys(h).find((x) => x.toLowerCase() === name);
  return k ? h[k] : null;
};
// A time in the request (the Dutch BGT's datetime=now) would never match the recording: the key without it.
// The site's data folders renamed on 27. 11. 2026 (data/vyvoj → built-up-age, brno/parkovani → parking, plzen/zony.json →
// zones.json): recordings and requests under the new names, so old recordings and old code still meet.
export const stamp = (k) => k.replace(/([?&]datetime=)[^&\s]*/g, "$1NOW")
  .replace(/^(\w+ SELF\/data\/)(?:vyvoj\/)/, "$1built-up-age/").replace(/^(\w+ SELF\/data\/brno\/)parkovani\//, "$1parking/")
  .replace(/^(\w+ SELF\/data\/plzen\/)zony\.json/, "$1zones.json");
// The key of a request: the app's own server by its path only (the recording and a replay may be served on other ports).
export const keyOf = (u, init, origin) => {
  const range = headerOf(init, "range"), b = init?.body;
  const where = u.origin === origin ? `SELF${u.pathname}${u.search}` : u.href;
  return stamp(`${(init?.method || "GET").toUpperCase()} ${where}${range ? ` R:${range}` : ""}${typeof b === "string" ? ` B:${b}` : ""}`);
};
// The index (index.jsonl): the answers by request, each with the cut it was recorded in.
export function readIndex(text) {
  const index = new Map();
  for (const line of text.split("\n")) {
    if (!line) continue;
    const e = JSON.parse(line);
    e.key = stamp(e.key.replace(/^(\w+ )http:\/\/localhost:\d+/, "$1SELF")); // recorded before the keys dropped the port
    if (!index.has(e.key)) index.set(e.key, []);
    index.get(e.key).push(e);
  }
  return index;
}
// The answer for this cut: those recorded during it, in order (the last one again when they run out); a request
// the recording answered in another cut (a memory cache of the app spared it then): the first good answer.
// served: how many times each request of a cut was answered (a Map the player keeps).
export function answerFor(index, served, cutId, key) {
  const all = index.get(key);
  if (!all) return null;
  let mine = all.filter((e) => e.cut === cutId);
  // What ?replay=fill asked live in this cut (fill: 1) replaces the old answers of the same request that were errors:
  // the app was given the live one at once (an old 503 first would have it retry or give up).
  if (mine.some((e) => e.fill)) mine = mine.filter((e) => e.fill);
  if (mine.length) {
    const k = `${cutId}|${key}`, n = served.get(k) || 0;
    served.set(k, n + 1);
    return mine[Math.min(n, mine.length - 1)];
  }
  // (of the same recording first: its sample's name before the colon; the common folder holds several, e.g. with the
  // packs' index of different times)
  const good = (e) => !e.error && e.status < 500, group = cutId.split(":")[0] + ":";
  return all.find((e) => good(e) && e.cut.startsWith(group)) || all.find(good) || all[0];
}
// A recorded failure as the error fetch would have thrown.
export const toError = (x) => (x.name === "TypeError" ? new TypeError(x.message) : new DOMException(x.message, x.name));
