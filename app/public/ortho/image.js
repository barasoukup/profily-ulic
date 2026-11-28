import { CHAINS, SOURCES, sourcesAt, usableAt } from "./registry.js";
import { R, merc } from "./mercator.js";
import { tileUrlOf, urlOf } from "./service.js";
import { SI_RETRY, siDown, siFetch, siTries } from "./si-retry.js";

export const ALONG = 20;
const TIMEOUT = 4000;
// An image without the photo: outside the Land's coverage the services answer white (or black, or transparent).
function blank(img) {
  let n = 0, empty = 0;
  for (let o = 0; o < img.data.length; o += 4 * 37) {
    n++;
    const [r, g, b, a] = [img.data[o], img.data[o + 1], img.data[o + 2], img.data[o + 3]];
    if (a === 0 || (r > 250 && g > 250 && b > 250) || (r < 4 && g < 4 && b < 4)) empty++;
  }
  return empty > n * 0.5;
}
// One tile or image asked politely: a 429 (Denmark's Dataforsyningen under load) is asked once more after a pause, within
// the same signal: Retry-After where the server gives it (at most 2 s), else a random 0.5–2 s, so that the 30 tiles of a
// cut that all got a 429 do not come back at once (the hostile review of 26. 11. 2026). A 429 again is an outage (503).
// An answer of 200 that is not an image (not image/*: Malta's ServiceExceptionReport, evaluation/malta/SOURCES.md; XML, text,
// JSON, an SVG) is the WMS's own exception, mostly outside its coverage: a lasting state, so "no image" (404), not an outage
// (the hostile review: it was told as one since the review of Malta). An outage stays a network error, a 5xx and a 429
// after the retry. A body not used is cancelled.
export const RETRY_429_MS = [500, 2000];
const drop = (r) => r.body?.cancel?.().catch(() => {});
export async function askImage(fetchImpl, url, init, random = Math.random) {
  let r = await fetchImpl(url, init);
  if (r.status === 429) {
    drop(r);
    const after = Number(r.headers?.get?.("retry-after")), [lo, hi] = RETRY_429_MS;
    await new Promise((ok) => setTimeout(ok, Number.isFinite(after) && after > 0 ? Math.min(after * 1000, hi) : lo + random() * (hi - lo)));
    if (init?.signal?.aborted) return new Response(null, { status: 429 });
    r = await fetchImpl(url, init);
    if (r.status === 429) { drop(r); return new Response(null, { status: 503, statusText: "429 after a retry" }); }
  }
  if (!r.ok) { drop(r); return r; }
  const type = r.headers?.get?.("content-type") || "";
  if (type && !/^image\//i.test(type)) { drop(r); return new Response(null, { status: 404, statusText: "no image (the service's exception)" }); }
  if (/svg/i.test(type)) { drop(r); return new Response(null, { status: 404, statusText: "no image (SVG)" }); }
  return r;
}
export const median = (a) => { const b = a.filter((v) => !Number.isNaN(v)).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
// ---------- the image: one request, sampled on the cut's grid (t across, u along) ----------
// t0, t1: the stretch across the cut wanted (m). Returns { source, st } or null (no answer in time, a bad image).
// st.L: the brightness per pixel; st.G: how much greener than red and blue it is, st.Y: how much yellower than blue,
// st.D: green less red (derive.js surfaceLook: grass, dry grass or paving beside a roadway read from the lines),
// st.S: the saturation (max less min of the channels; ortho-osm.js: does a column look like the roadway). decode: a PNG decoder for Node (no canvas there; the evaluation),
// which asks ČÚZK for a PNG.
export async function laneImage(opts) {
  // A state with no orthophoto it may use (Lithuania: the NŽT's is for viewing on its geoportal only): none.
  if (opts.source === "none") return null;
  // A chain: the sources whose area holds the cut, in the chain's order (a blank image is no photo; a failure is told, as in Belgium
  // and Portugal); a chain that shares one timeout gives each source what is left of it.
  const chain = CHAINS[opts.source];
  if (chain) return chainImage(chain, opts);
  // A source the app does not know: no image (not ČÚZK's, which covers only Czechia; Bára 26. 11. 2026).
  const src = SOURCES[opts.source];
  if (!src || !usableAt(src, ...opts.frame.toLonLat(0, 0))) return null;
  // A server that hangs now and then (Slovenia: GURS's, a 504 after 30 s): each try cut short at SI_RETRY.timeout, within SI_RETRY.budget;
  // an image that would not decode or a 404 is no image (not tried again). A PNG (Node's evaluation, decode) takes GURS 4–7 s, twice
  // the JPEG's time. The images kept for the session only with the browser's fetch.
  if (src.hangs) {
    const fetchImpl = opts.fetchImpl ?? siFetch, slow = opts.decode ? 2 : 1;
    return siTries((timeout) => laneImageOf(src.id, { ...opts, fetchImpl, timeout }), opts.timeout ?? SI_RETRY.timeout * slow, SI_RETRY.budget * slow);
  }
  if (opts.timeout !== undefined) return laneImageOf(src.id, opts);
  // Any other server failing now and then (Spain's PNOA: a 502 after 6 s one time in eight, Bára 27. 11. 2026) is tried again as GURS
  // is (siTries: a try TIMEOUT long, pauses, SI_RETRY.budget in all); a timeout given is the whole budget.
  return siTries((timeout) => laneImageOf(src.id, { ...opts, timeout }), TIMEOUT, SI_RETRY.budget, src.id);
}
async function chainImage(chain, opts) {
  const start = Date.now(), budget = opts.timeout ?? TIMEOUT;
  let lastError = null;
  for (const src of await sourcesAt(chain.id, ...opts.frame.toLonLat(0, 0))) {
    const left = budget - (Date.now() - start);
    if (chain.share && left < 500) break;
    try { const out = await laneImageOf(src.id, chain.share ? { ...opts, timeout: left } : opts); if (out) return out; } catch (err) { lastError = err; }
  }
  if (lastError) throw lastError;
  return null;
}
async function laneImageOf(key, { frame, dir, t0, t1, timeout = TIMEOUT, fetchImpl = fetch, decode = null }) {
  // A source that needs a key (Denmark's token) and has none: said as such, nothing asked.
  if (SOURCES[key]?.key && !SOURCES[key].key()) throw Object.assign(new Error("ortofoto: chybí klíč"), { noKey: true });
  const src = SOURCES[key], normal = [-dir[1], dir[0]];
  const k = Math.cos((frame.toLonLat(0, 0)[1] * Math.PI) / 180);
  // A point on the ground is read where the image shows it: moved by the orthophoto's shift (Web Mercator metres).
  const [sx, sy] = (src.shift || [0, 0]).map((v) => v / k);
  const at = (t, u) => { const [mx, my] = merc(...frame.toLonLat(normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u)); return [mx + sx, my + sy]; };
  const corners = [];
  for (const t of [t0, t1]) for (const u of [-ALONG, ALONG]) corners.push(at(t, u));
  // The box snapped to the source's pixel grid (in Web Mercator metres), so a place gets the same pixels however
  // the cut lies around it.
  const px = src.res / k, snap = (v, up) => (up ? Math.ceil(v / px) : Math.floor(v / px)) * px;
  let x0 = snap(Math.min(...corners.map((c) => c[0])), false), x1 = snap(Math.max(...corners.map((c) => c[0])), true);
  let y0 = snap(Math.min(...corners.map((c) => c[1])), false), y1 = snap(Math.max(...corners.map((c) => c[1])), true);
  const w = Math.round(((x1 - x0) * k) / src.res), h = Math.round(((y1 - y0) * k) / src.res);
  if (w > 2000 || h > 2000) return null;
  try {
    let img;
    if (src.service.type === "xyz") {
      // XYZ tiles of Web Mercator, glued on a canvas; the bbox becomes the tiles' own.
      const size = (2 * Math.PI * R) / 2 ** src.service.z;
      const tx0 = Math.floor((x0 + Math.PI * R) / size), tx1 = Math.floor((x1 + Math.PI * R) / size);
      const ty0 = Math.floor((Math.PI * R - y1) / size), ty1 = Math.floor((Math.PI * R - y0) / size);
      if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 30) return null;
      const tp = src.service.px || 256; // pixels of a tile
      const canvas = new OffscreenCanvas((tx1 - tx0 + 1) * tp, (ty1 - ty0 + 1) * tp), g = canvas.getContext("2d");
      const signal = AbortSignal.timeout(timeout), jobs = [];
      // A server error on every tile is an outage (app.js says so), not an empty image; a key turned away on every
      // tile is no key (noKey).
      let down = 0, missing = 0, denied = 0;
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) jobs.push(askImage(fetchImpl, tileUrlOf(src.service, tx, ty), { signal }).then(async (r) => { if (r.ok) g.drawImage(await createImageBitmap(await r.blob()), (tx - tx0) * tp, (ty - ty0) * tp, tp, tp); else if (r.status >= 500) down++; else if (src.key && (r.status === 401 || r.status === 403)) denied++; else missing++; }));
      await Promise.all(jobs);
      if (jobs.length && down === jobs.length) throw Object.assign(new Error(`ortofoto ${down}× 5xx`), { outage: true });
      if (jobs.length && denied === jobs.length) throw Object.assign(new Error("ortofoto: klíč odmítnut"), { noKey: true });
      if (missing && src.fallback) return laneImageOf(src.fallback, { frame, dir, t0, t1, timeout, fetchImpl, decode });
      img = g.getImageData(0, 0, canvas.width, canvas.height);
      x0 = tx0 * size - Math.PI * R; x1 = (tx1 + 1) * size - Math.PI * R; y1 = Math.PI * R - ty0 * size; y0 = Math.PI * R - (ty1 + 1) * size;
    } else {
      const r = await askImage(fetchImpl, urlOf(src.service, [x0, y0, x1, y1], w, h, decode ? "image/png" : undefined), { signal: AbortSignal.timeout(timeout) });
      if (!r.ok) { if (r.status >= 500) throw Object.assign(new Error(`ortofoto ${r.status}`), { outage: true }); return null; } // a server error: an outage
      if (decode) {
        const png = await decode(await r.arrayBuffer());
        img = { width: png.width, height: png.height, data: png.rgba };
      } else {
        const bmp = await createImageBitmap(await r.blob());
        const canvas = new OffscreenCanvas(bmp.width, bmp.height), g = canvas.getContext("2d");
        g.drawImage(bmp, 0, 0);
        img = g.getImageData(0, 0, bmp.width, bmp.height);
      }
    }
    // Outside a Land's coverage its WMS answers white, and so do the sources of Belgium, Portugal, Italy, Finland, Malta, Denmark,
    // Estonia and Cyprus (the reviews of 24. 11. 2026): Cyprus's missing tiles (404 by the Green Line) are left transparent on the
    // canvas. Such a source is `blank` in the registry.
    if (src.blank && blank(img)) return null;
    // Resample on the grid of the cut.
    let unknown = 0;
    const res = src.res, nt = Math.round((t1 - t0) / res), nu = Math.round((2 * ALONG) / res), L = new Float32Array(nt * nu), G = new Float32Array(nt * nu), Y = new Float32Array(nt * nu), D = new Float32Array(nt * nu), S = new Float32Array(nt * nu);
    for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) {
      const [mx, my] = at(t0 + (i + 0.5) * res, ALONG - (j + 0.5) * res);
      const px = Math.floor(((mx - x0) / (x1 - x0)) * img.width), py = Math.floor(((y1 - my) / (y1 - y0)) * img.height);
      const o = (py * img.width + px) * 4;
      // Beyond the image, or a pixel with no photo (a tile that did not come, 404, 400 or 429, left transparent on the
      // canvas; a transparent edge): not known (NaN), not black (the reviews of Cyprus and Denmark, 24. 11. 2026).
      if (px < 0 || py < 0 || px >= img.width || py >= img.height || img.data[o + 3] === 0) { L[j * nt + i] = G[j * nt + i] = Y[j * nt + i] = D[j * nt + i] = S[j * nt + i] = NaN; unknown++; continue; }
      L[j * nt + i] = 0.299 * img.data[o] + 0.587 * img.data[o + 1] + 0.114 * img.data[o + 2];
      const [r, g, b] = [img.data[o], img.data[o + 1], img.data[o + 2]];
      G[j * nt + i] = g - (r + b) / 2;
      Y[j * nt + i] = (r + g) / 2 - b;
      D[j * nt + i] = g - r;
      S[j * nt + i] = Math.max(r, g, b) - Math.min(r, g, b);
    }
    // Mostly unknown (tiles missing over half the cut): no image, lanes are not read from blanks.
    if (unknown > nt * nu * 0.5) return null;
    if (src.balance) balance(G, Y, D, S);
    return { source: key, st: { nt, nu, res, t0, L, G, Y, D, S, fine: src.fine !== false } };
  } catch (e) {
    // The server did not answer (a server error, the network, the timeout): an outage, passed on for app.js to say
    // (Bára 16. 11. 2026); anything else (an image that would not decode) is just no image, as before.
    if (e?.outage || e?.noKey || e?.name === "TypeError" || e?.name === "TimeoutError" || e?.name === "AbortError") throw e;
    return null;
  }
}
// A grey world for a tinted mosaic: the median tint of the greyish pixels (saturation under 40: asphalt, paving,
// roofs) is no tint; strong colours (lawns, treetops) keep theirs.
function balance(G, Y, D, S) {
  const g = [], y = [], d = [];
  for (let q = 0; q < G.length; q += 5) if (S[q] < 40) { g.push(G[q]); y.push(Y[q]); d.push(D[q]); }
  if (g.length < 100) return;
  const [mg, my, md] = [median(g), median(y), median(d)];
  for (let q = 0; q < G.length; q++) { G[q] -= mg; Y[q] -= my; D[q] -= md; }
}
// ---------- a north-up square of the orthophoto (ai-kerbs.js) ----------
// The square of side 2 × half m on the ground around lon, lat, px × px pixels, north up, in Web Mercator as the AI
// model learnt it (evaluation/ai-segmentation/fetch_ortho.py): the source's shift applied as above. Returns
// { source, img } (ImageData) or null (no photo there); a server down throws as laneImage does.
export async function orthoPatch({ source, lon, lat, half, px, timeout = TIMEOUT, fetchImpl = null }) {
  // No orthophoto it may use (Lithuania): none, and nothing asked of ČÚZK (the review of Lithuania).
  if (source === "none") return null;
  // A server that hangs (Slovenia: GURS): tried again and the square kept (siTries, siFetch); just down: an outage at once.
  const own = SOURCES[source];
  if (own?.hangs) {
    if (siDown()) throw Object.assign(new Error("ortofoto GURS nedostupné"), { outage: true });
    const img = await siTries((t) => patchOf(own.id, lon, lat, half, px, t, fetchImpl ?? siFetch), SI_RETRY.timeout, SI_RETRY.patchBudget);
    return img ? { source: own.id, img } : null;
  }
  for (const src of await sourcesAt(source, lon, lat)) {
    const img = await patchOf(src.id, lon, lat, half, px, timeout);
    if (img) return { source: src.id, img };
  }
  return null;
}
async function patchOf(key, lon, lat, half, px, timeout, fetchImpl = fetch) {
  if (SOURCES[key]?.key && !SOURCES[key].key()) return null;
  const src = SOURCES[key], k = Math.cos((lat * Math.PI) / 180), h = half / k;
  const [sx, sy] = (src.shift || [0, 0]).map((v) => v / k), [cx, cy] = merc(lon, lat);
  const b = [cx - h + sx, cy - h + sy, cx + h + sx, cy + h + sy];
  const canvas = new OffscreenCanvas(px, px), g = canvas.getContext("2d");
  const signal = AbortSignal.timeout(timeout);
  if (src.service.type === "xyz") {
    const size = (2 * Math.PI * R) / 2 ** src.service.z, scale = px / (b[2] - b[0]);
    const tx0 = Math.floor((b[0] + Math.PI * R) / size), tx1 = Math.floor((b[2] + Math.PI * R) / size);
    const ty0 = Math.floor((Math.PI * R - b[3]) / size), ty1 = Math.floor((Math.PI * R - b[1]) / size);
    if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 40) return null;
    let down = 0, missing = 0;
    const jobs = [];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const gx = tx * size - Math.PI * R, gy = Math.PI * R - ty * size;
      jobs.push(askImage(fetch, tileUrlOf(src.service, tx, ty), { signal }).then(async (r) => {
        if (r.ok) g.drawImage(await createImageBitmap(await r.blob()), (gx - b[0]) * scale, (b[3] - gy) * scale, size * scale, size * scale);
        else if (r.status >= 500) down++; else missing++;
      }));
    }
    await Promise.all(jobs);
    if (jobs.length && down === jobs.length) throw Object.assign(new Error(`ortofoto ${down}× 5xx`), { outage: true });
    if (missing && src.fallback) return patchOf(src.fallback, lon, lat, half, px, timeout);
  } else {
    const r = await askImage(fetchImpl, urlOf(src.service, b, px, px), { signal });
    if (!r.ok) { if (r.status >= 500) throw Object.assign(new Error(`ortofoto ${r.status}`), { outage: true }); return null; }
    g.drawImage(await createImageBitmap(await r.blob()), 0, 0, px, px);
  }
  const img = g.getImageData(0, 0, px, px);
  return blank(img) ? null : img;
}
