// The recorder and player of the data sources' answers (evaluation/replay/server.mjs puts it before app.js). Every
// request for data (another host, the app server's /api/ and data/) goes through it: ?replay=record asks the
// source and keeps the answer, ?replay=play gives the recorded answer and asks nobody (a request never recorded
// fails as a network error and is listed as a miss). The app's own files (code, illustrations, boundaries) are
// always the current ones. Then every cut of the sample is made as a click, and what the visitor would see is
// written to data/out/<run>/<id>.json: the profile, the status line, the export SVG with and without the
// illustrations, the credits, the city, the design's warnings and the editor of each part, a saved file reloaded.
//   ?replay=record|play|fill &run=<name> &sample=<file without .json> &from=&to= &lang=cs|sk|en|de (+ any switch of the app)
const P = new URLSearchParams(location.search);
const MODE = P.get("replay"), RUN = P.get("run") || MODE, SAMPLE = P.get("sample") || "sample";
const FROM = Number(P.get("from") || 0), TO = Number(P.get("to") || Infinity);
const native = window.fetch.bind(window);
const H = (globalThis.PROFILY_REPLAY = { progress: "start" });
try { localStorage.clear(); sessionStorage.clear(); } catch {}

const isData = (u) => u.origin !== location.origin || u.pathname.startsWith("/api/") || u.pathname.startsWith("/data/");
const headerOf = (init, name) => {
  const h = init?.headers;
  if (!h) return null;
  if (h instanceof Headers) return h.get(name);
  const k = Object.keys(h).find((x) => x.toLowerCase() === name);
  return k ? h[k] : null;
};
const keyOf = (u, init) => {
  const range = headerOf(init, "range"), b = init?.body;
  // The app's own server by its path only (the recording and a replay may be served on other ports).
  const where = u.origin === location.origin ? `SELF${u.pathname}${u.search}` : u.href;
  return `${(init?.method || "GET").toUpperCase()} ${where}${range ? ` R:${range}` : ""}${typeof b === "string" ? ` B:${b}` : ""}`;
};
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
const KEEP = ["content-type", "content-range", "etag", "accept-ranges"];
const errorOf = (e) => ({ name: e?.name || "TypeError", message: String(e?.message || e) });
const toError = (x) => (x.name === "TypeError" ? new TypeError(x.message) : new DOMException(x.message, x.name));

let cutId = null, pending = 0;
const idle = [];
const done = () => { if (--pending === 0) idle.splice(0).forEach((r) => r()); };
const misses = [], recorded = [], uploaded = new Set();
// Replay: the answers by request, each with the cut it was recorded in.
let index = null;
const served = new Map();
async function loadIndex() {
  index = new Map();
  const text = await native("/__replay/index").then((r) => r.text());
  for (const line of text.split("\n")) {
    if (!line) continue;
    const e = JSON.parse(line);
    e.key = e.key.replace(/^(\w+ )http:\/\/localhost:\d+/, "$1SELF"); // recorded before the keys dropped the port
    if (!index.has(e.key)) index.set(e.key, []);
    index.get(e.key).push(e);
  }
}
// The answer for this cut: those recorded during it, in order (the last one again when they run out); a request
// the recording answered in another cut (a memory cache of the app spared it then): the first good answer.
function answerFor(key) {
  const all = index.get(key);
  if (!all) return null;
  const mine = all.filter((e) => e.cut === cutId);
  if (mine.length) {
    const k = `${cutId}|${key}`, n = served.get(k) || 0;
    served.set(k, n + 1);
    return mine[Math.min(n, mine.length - 1)];
  }
  return all.find((e) => !e.error && e.status < 500) || all[0];
}
const bodies = new Map();
const bodyOf = (sha) => bodies.get(sha) || (bodies.set(sha, native(`/__replay/body/${sha}`).then((r) => r.arrayBuffer())), bodies.get(sha));

window.fetch = async (input, init = {}) => {
  const u = new URL(typeof input === "string" || input instanceof URL ? String(input) : input.url, location.href);
  if (!isData(u) || !MODE) { pending++; try { return await native(input, init); } finally { done(); } }
  const key = keyOf(u, init), signal = init.signal;
  pending++;
  try {
    // ?replay=fill (evaluation/holdout): the recorded answer where there is one (no source asked twice), else live and
    // recorded, as record.
    const filled = MODE === "fill" ? answerFor(key) : null;
    if (MODE === "play" || (filled && !filled.error && filled.status < 500)) {
      const e = filled || answerFor(key);
      if (!e) { misses.push(key); throw new TypeError("replay: not recorded"); }
      if (e.error) throw toError(e.error);
      const buf = await bodyOf(e.sha);
      if (signal?.aborted) throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
      return new Response(e.status === 204 || e.status === 304 ? null : buf, { status: e.status, statusText: e.statusText || "", headers: e.headers });
    }
    // Record: asked with the app's signal (an answer it gave up on is cancelled, as in the app), the whole body read.
    let got;
    try { const r = await native(input, init); got = { r, buf: await r.arrayBuffer() }; }
    catch (err) { recorded.push({ key, cut: cutId, error: errorOf(err) }); throw err; }
    const { r, buf } = got;
    const sha = hex(await crypto.subtle.digest("SHA-1", buf));
    const headers = Object.fromEntries(KEEP.map((h) => [h, r.headers.get(h)]).filter(([, v]) => v !== null));
    recorded.push({ key, cut: cutId, status: r.status, statusText: r.statusText, headers, sha });
    if (!uploaded.has(sha)) { uploaded.add(sha); await native(`/__replay/body/${sha}`, { method: "POST", body: buf }); }
    return new Response(r.status === 204 || r.status === 304 ? null : buf, { status: r.status, statusText: r.statusText, headers });
  } finally {
    done();
  }
};

// Errors and the app's warnings, per cut.
const notes = [];
for (const k of ["error", "warn"]) {
  const own = console[k].bind(console);
  console[k] = (...a) => { notes.push(`${k}: ${a.map((x) => (x instanceof Error ? x.message : typeof x === "string" ? x : JSON.stringify(x))).join(" ").slice(0, 300)}`); own(...a); };
}
addEventListener("error", (e) => notes.push(`uncaught: ${e.message}`));
addEventListener("unhandledrejection", (e) => notes.push(`unhandled: ${e.reason?.message || e.reason}`));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// One turn of the event loop without a timer (a hidden page slows timers down to one a second or a minute).
const channel = new MessageChannel(), turns = [];
channel.port1.onmessage = () => turns.shift()?.();
const turn = () => new Promise((r) => { turns.push(r); channel.port2.postMessage(0); });
// Settled: no request under way for a while (the signs and sprites load after a cut, then redraw).
async function settle() {
  for (let quiet = 0; quiet < 30;) { await turn(); quiet = pending ? 0 : quiet + 1; if (pending) await new Promise((r) => idle.push(r)); }
}
const $ = (s) => document.querySelector(s);
const text = (s) => $(s)?.textContent ?? null;
const html = (s) => $(s)?.innerHTML ?? null;
const mode = async (m) => { $(`.seg-toggle button[data-mode="${m}"]`)?.click(); await settle(); };

async function capture(p, mods) {
  const { svgString, exportCredits, setArt, getArt } = mods.profile, { city } = mods.city;
  const A = H, st = A.state;
  const out = { id: p.id, town: p.town, misses: [], notes: [] };
  out.status = text("#status");
  out.statusClass = $("#status")?.className;
  out.title = text("#street-name");
  out.sub = text("#profile-sub");
  out.stavText = text("#stav-text");
  out.footer = text("#footer-data");
  out.city = JSON.parse(JSON.stringify(city));
  out.cut = st.cut;
  out.stav = st.stav;
  if (!st.stav) return out;
  // &light=1 (evaluation/holdout): only the profile and the surfaces along the cut, no drawings.
  if (P.get("light")) { out.eval = globalThis.__profilyEval || null; out.credits = exportCredits(st.cut?.sources); return out; }
  out.credits = exportCredits(st.cut?.sources);
  out.svg = svgString(A.exportSvgs());
  const art = getArt();
  setArt(!art); A.render(); await settle();
  out.svgOtherArt = svgString(A.exportSvgs());
  setArt(art); A.render(); await settle();
  out.shares = html("#shares");
  out.widthCheck = html("#width-check");
  out.legend = html("#legend");
  out.cutInfo = html("#cut-info");
  // Návrh: the warnings, the palette, and the editor of every part (its signs to add among them).
  await mode("navrh");
  out.ruleCheck = html("#rule-check");
  out.palette = html("#palette");
  out.editors = [];
  for (let i = 0; i < st.navrh.segments.length; i++) {
    st.selected = i; A.render();
    out.editors.push(html("#editor"));
  }
  st.selected = null;
  out.svgNavrh = svgString(A.exportSvgs());
  await mode("porovnat");
  out.compare = html("#profile");
  await mode("stav");
  // The saved file, loaded again (validate.js): what comes back.
  const file = JSON.parse(JSON.stringify({ app: "streetdesign-pilot", version: 1, cut: st.cut, stav: st.stav, navrh: st.navrh, navrhEdited: st.navrhEdited, zdroje: exportCredits(st.cut?.sources).join("\n") }));
  A.restore(file);
  await settle();
  out.restored = { cut: st.cut, city: city.id, art: city.art, credits: exportCredits(st.cut?.sources), svg: svgString(A.exportSvgs()) };
  return out;
}

async function main() {
  if (!MODE) return;
  // The app is up when its cut function is there and nothing loads.
  while (!(window.cutAt && H.state && window.profilyReady)) await sleep(100);
  await settle();
  const mods = { profile: await import("/profile.js"), city: await import("/city.js") };
  if (MODE === "play" || MODE === "fill") await loadIndex();
  const sample = (await native(`/__replay/sample?name=${SAMPLE}`).then((r) => r.json())).filter((p) => p.id >= FROM && p.id <= TO);
  const t0 = Date.now();
  for (const [n, p] of sample.entries()) {
    cutId = `${SAMPLE}:${p.id}`;
    misses.length = 0; notes.length = 0;
    H.progress = `${n + 1}/${sample.length} ${cutId}`;
    let out;
    try {
      await Promise.race([window.cutAt(p.lat, p.lon), sleep(180000).then(() => { throw new Error("cut timeout"); })]);
      await settle();
      out = await capture(p, mods);
    } catch (e) {
      out = { id: p.id, town: p.town, failed: String(e?.stack || e) };
    }
    out.misses = [...misses];
    out.notes = [...notes];
    await native(`/__replay/out?run=${RUN}&id=${p.id}`, { method: "POST", body: JSON.stringify(out) });
    if ((MODE === "record" || MODE === "fill") && recorded.length) {
      await native("/__replay/index", { method: "POST", body: JSON.stringify(recorded.splice(0)) });
    }
  }
  H.progress = `done ${sample.length} in ${Math.round((Date.now() - t0) / 1000)} s`;
  await native(`/__replay/out?run=${RUN}&id=_done`, { method: "POST", body: JSON.stringify({ progress: H.progress, mode: MODE, sample: SAMPLE, lang: P.get("lang"), search: location.search }) });
}
main().catch((e) => { H.progress = `failed: ${e?.stack || e}`; });
