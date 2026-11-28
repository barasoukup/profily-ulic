// What the town modules share (towns/shared.js): the geometry as polygons, rings and paths, the answers kept by key,
// the request with a time limit and the pages of an Opendatasoft table. fetch is stubbed (no network).
import { test } from "node:test";
import assert from "node:assert/strict";
import { polygonsOf, ringsOf, pathsOf, boxKey, cachedBy, askJson, askText, opendataRecords } from "../app/public/towns/shared.js";

const ring = [[0, 0], [1, 0], [1, 1], [0, 0]], hole = [[0.2, 0.2], [0.4, 0.2], [0.4, 0.4], [0.2, 0.2]];

test("polygonsOf: a polygon is one, a multipolygon its parts, any other geometry none", () => {
  assert.deepEqual(polygonsOf({ type: "Polygon", coordinates: [ring, hole] }), [[ring, hole]]);
  assert.deepEqual(polygonsOf({ type: "MultiPolygon", coordinates: [[ring], [hole]] }), [[ring], [hole]]);
  assert.deepEqual(polygonsOf({ type: "Point", coordinates: [0, 0] }), []);
  assert.deepEqual(polygonsOf(null), []);
});

test("ringsOf: all the rings in one array, null for a geometry with no area", () => {
  assert.deepEqual(ringsOf({ type: "Polygon", coordinates: [ring, hole] }), [ring, hole]);
  assert.deepEqual(ringsOf({ type: "MultiPolygon", coordinates: [[ring, hole], [ring]] }), [ring, hole, ring]);
  assert.equal(ringsOf({ type: "LineString", coordinates: ring }), null);
  assert.equal(ringsOf(undefined), null);
});

test("pathsOf: a line is one path, a multiline its lines, any other geometry none", () => {
  assert.deepEqual(pathsOf({ type: "LineString", coordinates: ring }), [ring]);
  assert.deepEqual(pathsOf({ type: "MultiLineString", coordinates: [ring, hole] }), [ring, hole]);
  assert.deepEqual(pathsOf({ type: "Polygon", coordinates: [ring] }), []);
});

test("boxKey: each number rounded to 4 decimals (5 on request), so a cut moved a metre keeps its key", () => {
  assert.equal(boxKey("14.4200001,50.08,14.43,50.09000049"), "14.4200,50.0800,14.4300,50.0900");
  assert.equal(boxKey("14.4200001,50.08", 5), "14.42000,50.08000");
});

test("cachedBy: one request a key, and the promise is kept", async () => {
  const memo = new Map();
  let asked = 0;
  const make = () => { asked++; return Promise.resolve(asked); };
  assert.equal(await cachedBy(memo, "a", make), 1);
  assert.equal(await cachedBy(memo, "a", make), 1);
  assert.equal(asked, 1);
});

test("cachedBy: a failed answer is forgotten, the next click asks again", async () => {
  const memo = new Map();
  await assert.rejects(cachedBy(memo, "a", () => Promise.reject(new Error("503"))), /503/);
  assert.equal(memo.has("a"), false);
  assert.equal(await cachedBy(memo, "a", () => Promise.resolve("ok")), "ok");
});

test("cachedBy: at most max kept (the new one in, then the oldest out); evictFirst keeps one more", () => {
  const kept = (opts) => {
    const memo = new Map();
    for (let i = 1; i <= 6; i++) cachedBy(memo, `k${i}`, () => Promise.resolve(i), opts);
    return [...memo.keys()];
  };
  assert.deepEqual(kept({ max: 3 }), ["k4", "k5", "k6"]);
  assert.deepEqual(kept({ max: 3, evictFirst: true }), ["k3", "k4", "k5", "k6"]);
  assert.equal(kept().length, 6);
});

// A stand-in for fetch: answers by the list, remembers the addresses.
const stubFetch = (answers) => {
  const urls = [], real = globalThis.fetch;
  globalThis.fetch = async (url) => { urls.push(String(url)); const a = answers.shift(); return new Response(a.body, { status: a.status ?? 200 }); };
  return { urls, restore: () => { globalThis.fetch = real; } };
};

test("askJson and askText: the answer, and a refusal named by the label or else the host", async () => {
  const s = stubFetch([{ body: '{"a":1}' }, { body: "<gml/>" }, { body: "no", status: 503 }, { body: "no", status: 404 }]);
  try {
    assert.deepEqual(await askJson("https://x.example/q?a=1", 1000), { a: 1 });
    assert.equal(await askText("https://x.example/q", 1000), "<gml/>");
    await assert.rejects(askJson("https://x.example/q", 1000), { message: "x.example 503" });
    await assert.rejects(askText("https://x.example/q", 1000, "Catastro"), { message: "Catastro 404" });
  } finally { s.restore(); }
});

test("opendataRecords: pages of 100 while they are full, the parameters first and limit and offset last", async () => {
  const page = (n) => ({ body: JSON.stringify({ results: Array.from({ length: n }, (_, i) => ({ i })) }) });
  const s = stubFetch([page(100), page(100), page(7)]);
  try {
    const out = await opendataRecords("https://x.example/api/set", { where: "a=1", select: "b" });
    assert.equal(out.length, 207);
    assert.deepEqual(s.urls, [0, 100, 200].map((o) => `https://x.example/api/set/records?where=a%3D1&select=b&limit=100&offset=${o}`));
  } finally { s.restore(); }
});

test("opendataRecords: at most max records (five pages)", async () => {
  const full = () => ({ body: JSON.stringify({ results: new Array(100).fill({}) }) });
  const s = stubFetch([full(), full(), full(), full(), full(), full()]);
  try {
    assert.equal((await opendataRecords("https://x.example/api/set", {})).length, 500);
    assert.equal(s.urls.length, 5);
  } finally { s.restore(); }
});
