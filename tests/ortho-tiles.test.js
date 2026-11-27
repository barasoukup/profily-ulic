// Reading the orthophoto's tiles and images (lanes-ortho.js laneImage) when a server answers badly (the reviews of
// Cyprus, Malta, Estonia and Denmark, 24. 11. 2026): a missing tile is unknown (NaN), not black; mostly unknown is no
// image; a 429 is asked once more; an error sent as 200 XML is an outage; a blank Estonian image is none.
// No network: a canvas that keeps its pixels and bitmaps of one colour stand in for the browser's.
import { test } from "node:test";
import assert from "node:assert/strict";

// A canvas with real pixels (transparent black where nothing was drawn, as the browser's).
class Canvas {
  constructor(w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); }
  getContext() {
    return {
      drawImage: (bmp, x, y, w = bmp.width, h = bmp.height) => {
        for (let py = Math.max(0, Math.round(y)); py < Math.min(this.height, Math.round(y + h)); py++)
          for (let px = Math.max(0, Math.round(x)); px < Math.min(this.width, Math.round(x + w)); px++) this.data.set([...bmp.rgb, 255], (py * this.width + px) * 4);
      },
      getImageData: (x, y, w, h) => ({ width: w, height: h, data: this.data }),
    };
  }
}
globalThis.OffscreenCanvas = Canvas;
// The bitmap's colour is the body's text ("120,120,120").
globalThis.createImageBitmap = async (blob) => ({ width: 256, height: 256, rgb: (await blob.text()).split(",").map(Number) });
const grey = () => new Response("120,118,115", { status: 200, headers: { "content-type": "image/jpeg" } });

const L = await import("../app/public/lanes-ortho.js");
const frameAt = (lon, lat) => ({ toLonLat: (x, y) => [lon + x / (111320 * Math.cos((lat * Math.PI) / 180)), lat + y / 110540] });
const optsAt = (source, lon, lat) => ({ source, frame: frameAt(lon, lat), dir: [1, 0], t0: -12, t1: 12 });
const nanShare = (st) => st.L.filter(Number.isNaN).length / st.L.length;

test("Kypr: chybějící dlaždice (404 u Zelené linie) je neznámá, ne černá; skoro prázdný obraz není žádný", async () => {
  const opts = optsAt("cy", 33.3650, 35.1700);
  const asked = [];
  const full = await L.laneImage({ ...opts, fetchImpl: async (url) => { asked.push(url); return grey(); } });
  assert.ok(full && nanShare(full.st) === 0);
  // The tiles of the cut's westmost column are missing (ArcGIS cache: tile/{z}/{y}/{x}).
  const xOf = (url) => Number(url.split("/").pop());
  const west = Math.min(...asked.map(xOf)), cols = new Set(asked.map(xOf)).size;
  assert.ok(cols >= 2, "the cut spans tiles");
  const half = await L.laneImage({ ...opts, fetchImpl: async (url) => (xOf(url) === west ? new Response("", { status: 404 }) : grey()) });
  assert.ok(half, "a few tiles missing: still an image");
  const share = nanShare(half.st);
  assert.ok(share > 0 && share < 0.5, `unknown ${share}`);
  assert.ok(!half.st.L.some((v) => v === 0), "no black pixels");
  // All but the eastmost column missing: no image (nothing read from blanks).
  const east = Math.max(...asked.map(xOf));
  assert.equal(await L.laneImage({ ...opts, fetchImpl: async (url) => (xOf(url) !== east ? new Response("", { status: 404 }) : grey()) }), null);
});

test("Dánsko: dlaždice 400 je díra NaN, 429 se zeptá ještě jednou", async () => {
  const K = await import("../app/public/keys.js");
  K.setDkToken("test-token");
  try {
    const opts = optsAt("dk", 12.5685, 55.6761);
    const tries = new Map();
    const once429 = await L.laneImage({ ...opts, fetchImpl: async (url) => { tries.set(url, (tries.get(url) || 0) + 1); return tries.get(url) === 1 ? new Response("", { status: 429, headers: { "retry-after": "0" } }) : grey(); } });
    assert.ok(once429 && nanShare(once429.st) === 0, "every tile came on the second try");
    assert.ok([...tries.values()].every((n) => n === 2), "each asked exactly twice");
    // A tile that keeps answering 400 or 429: unknown, not black.
    let k = 0;
    const holes = await L.laneImage({ ...opts, fetchImpl: async () => (k++ % 4 === 0 ? new Response("", { status: k % 8 === 1 ? 400 : 429 }) : grey()) });
    assert.ok(holes, "an image with holes");
    assert.ok(nanShare(holes.st) > 0, "holes are NaN");
    assert.ok(!holes.st.L.some((v) => v === 0), "no black holes");
  } finally { K.setDkToken(""); }
});

test("Malta: výjimka WMS jako 200 text/xml je bez snímku (trvalý stav mimo pokrytí), ne výpadek; 5xx je výpadek", async () => {
  const opts = optsAt("mt", 14.5146, 35.8989);
  const xml = '<?xml version="1.0"?><ServiceExceptionReport><ServiceException>Could not get any sources</ServiceException></ServiceExceptionReport>';
  assert.equal(await L.laneImage({ ...opts, fetchImpl: async () => new Response(xml, { status: 200, headers: { "content-type": "text/xml" } }) }), null);
  assert.equal(await L.laneImage({ ...opts, fetchImpl: async () => new Response(xml, { status: 200, headers: { "content-type": "application/vnd.ogc.se_xml" } }) }), null);
  await assert.rejects(L.laneImage({ ...opts, fetchImpl: async () => new Response("", { status: 503 }) }), (e) => e.outage === true);
  // A real image still reads.
  const ok = await L.laneImage({ ...opts, fetchImpl: async () => grey() });
  assert.ok(ok && ok.source === "mt");
});

test("Estonsko: bílý snímek mimo pokrytí není ortofoto", async () => {
  const opts = optsAt("ee", 24.7536, 59.4370);
  assert.equal(await L.laneImage({ ...opts, fetchImpl: async () => new Response("255,255,255", { status: 200, headers: { "content-type": "image/jpeg" } }) }), null);
  assert.ok(await L.laneImage({ ...opts, fetchImpl: async () => grey() }));
});

test("askImage: 429 jednou znovu po náhodné pauze 0,5–2 s (znovu 429 je výpadek), co není image/* je bez snímku, nepoužité tělo zahozené", async () => {
  const [lo, hi] = L.RETRY_429_MS;
  assert.deepEqual([lo, hi], [500, 2000]);
  L.RETRY_429_MS[0] = 0; L.RETRY_429_MS[1] = 40;
  try {
    let n = 0;
    const r = await L.askImage(async () => (++n === 1 ? new Response("", { status: 429 }) : grey()), "u", {});
    assert.equal(r.status, 200);
    assert.equal(n, 2);
    n = 0;
    assert.equal((await L.askImage(async () => { n++; return new Response("", { status: 429 }); }, "u", {})).status, 503, "an outage after the retry");
    assert.equal(n, 2, "only once more");
    // The pause is random within the range (not all tiles at once).
    const t0 = Date.now();
    await L.askImage(async () => (++n % 2 ? new Response("", { status: 429 }) : grey()), "u", {}, () => 1);
    assert.ok(Date.now() - t0 >= 35);
  } finally { L.RETRY_429_MS[0] = lo; L.RETRY_429_MS[1] = hi; }
  for (const type of ["text/xml; charset=utf-8", "application/vnd.ogc.se_xml", "application/json", "text/html", "image/svg+xml"])
    assert.equal((await L.askImage(async () => new Response("<x/>", { status: 200, headers: { "content-type": type } }), "u", {})).status, 404, type);
  assert.equal((await L.askImage(async () => new Response("", { status: 404 }), "u", {})).status, 404);
  assert.equal((await L.askImage(async () => new Response("", { status: 502 }), "u", {})).status, 502);
  assert.equal((await L.askImage(async () => grey(), "u", {})).status, 200);
  // The body of an answer not used is cancelled.
  let cancelled = 0;
  const body = () => new ReadableStream({ start(c) { c.enqueue(new Uint8Array([60])); }, cancel() { cancelled++; } });
  await L.askImage(async () => new Response(body(), { status: 200, headers: { "content-type": "text/xml" } }), "u", {});
  await L.askImage(async () => new Response(body(), { status: 500 }), "u", {});
  await new Promise((ok) => setTimeout(ok, 0));
  assert.equal(cancelled, 2);
});
