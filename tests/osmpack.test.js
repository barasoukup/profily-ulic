// The OSM tiles of a country in one file (osmpack.js, tools/pack_osm_tiles.mjs): the shorter form decodes to the
// same elements as the tiles of osmtile.js, read in pieces as over HTTP Range.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeTile, mergePieces } from "../app/public/osmtile.js";
import { Pack, PackSet, encodeElement, decodePackedTile } from "../app/public/osmpack.js";
import { packTiles } from "../tools/pack_osm_tiles.mjs";

const diff = (pts) => pts.flatMap(([x, y], i) => (i ? [x - pts[i - 1][0], y - pts[i - 1][1]] : [x, y]));
const way = (id, o, pts, k = { highway: "residential", name: "Ječná" }) => JSON.stringify({ t: "w", i: id, k, o, g: diff(pts) });
// Tiles 2884_10016 and 2885_10016 (Prague), a line across their border, a building with a hole, a tree.
const TILES = {
  "2884_10016": [
    way(7, 0, [[14420000, 50080000], [14424000, 50080100], [14426000, 50080200]]),
    JSON.stringify({ t: "a", i: 9, k: { building: "yes", "building:levels": "5" }, q: 5, g: diff([[1442100, 5008010], [1442110, 5008010], [1442110, 5008020]]), h: [diff([[1442102, 5008012], [1442104, 5008012], [1442104, 5008014]])] }),
    JSON.stringify({ t: "n", i: 11, k: { natural: "tree", leaf_type: "broadleaved" }, g: [14421000, 50081000] }),
    JSON.stringify({ t: "a", i: 12, k: {}, g: diff([[14421000, 50081000], [14421100, 50081000], [14421000, 50081100]]) }),
  ],
  "2885_10016": [
    way(7, 1, [[14424000, 50080100], [14426000, 50080200], [14427000, 50080300]]),
    way(8, 0, [[14426000, 50082000], [14427000, 50082000]], { highway: "residential", oneway: "yes", "unusual:key": "x\"y" }),
  ],
};
const text = (n) => TILES[n].join("\n") + "\n";
const memory = (buf) => async (start, end) => ({ bytes: new Uint8Array(buf.subarray(start, end + 1)), etag: "a" });

test("krátký zápis prvku: slovník, klíč ze slovníku, vlastní klíč, první bod od rohu dlaždice", () => {
  const head = { keys: ["highway", "name"], pairs: [[0, "residential"]] };
  const dict = { pair: (k, v) => (k === "highway" && v === "residential" ? 0 : undefined), key: (k) => ({ highway: 0, name: 1 })[k] };
  const el = JSON.parse(way(7, 3, [[14420000, 50080000], [14424000, 50080100]], { highway: "residential", name: "Ječná", foo: "bar" }));
  const short = encodeElement(el, dict, 2884, 10016);
  assert.deepEqual(short, [0, 7, [0, -2, "Ječná", "foo", "bar"], [0, 0, 4000, 100], 3]);
  assert.deepEqual(decodePackedTile(JSON.stringify([short]), head, 2884, 10016), decodeTile(JSON.stringify(el)));
});

test("balík: každá dlaždice se přečte stejně jako soubor dlaždice, i bez slovníku", async () => {
  for (const opts of [{ minPair: 1, minKey: 1 }, {}]) {
    const { file } = packTiles(Object.keys(TILES), text, opts);
    const pack = new Pack(memory(file), 64); // short first read: the head comes in two
    const names = [...Object.keys(TILES), "2886_10016", "1_1"];
    const got = await pack.tiles(names);
    names.forEach((n, i) => assert.deepEqual(got[i], TILES[n] ? decodeTile(text(n)) : []));
    // The line across the border joins as from the tiles.
    assert.deepEqual(mergePieces(got), mergePieces(Object.keys(TILES).map((n) => decodeTile(text(n)))));
  }
});

test("sousední dlaždice jedním čtením, hlava a list bloku jen jednou", async () => {
  const { file } = packTiles(Object.keys(TILES), text);
  const reads = [];
  const pack = new Pack(async (s, e) => { reads.push([s, e]); return memory(file)(s, e); });
  await pack.tiles(["2884_10016", "2885_10016"]);
  assert.equal(reads.length, 3); // head, leaf, both tiles
  await pack.tiles(["2885_10016"]);
  assert.equal(reads.length, 4);
});

test("soubor vyměněný mezitím (jiné ETag) se přečte znovu od hlavy", async () => {
  const one = packTiles(["2884_10016"], text).file, two = packTiles(Object.keys(TILES), text).file;
  let now = { file: one, etag: "1" };
  const pack = new Pack(async (s, e) => ({ bytes: new Uint8Array(now.file.subarray(s, e + 1)), etag: now.etag }));
  assert.deepEqual(await pack.tiles(["2885_10016"]), [[]]);
  now = { file: two, etag: "2" };
  assert.deepEqual(await pack.tiles(["2885_10016"]), [[]]); // the head is still the old one: no tile there
  const got = await pack.tiles(["2884_10016"]); // a leaf read now sees the other ETag
  assert.deepEqual(got[0], decodeTile(text("2884_10016")));
  assert.deepEqual((await pack.tiles(["2885_10016"]))[0], decodeTile(text("2885_10016")));
});

test("státy podle index.json; když R2 selže, čte se tentýž balík odjinud (Pages)", async () => {
  const cz = packTiles(["2884_10016"], text).file, sk = packTiles(["2885_10016"], text).file;
  const index = { files: { cz: "cz-1.posm", sk: "sk-1.posm" } };
  const hosts = { pages: { "index.json": index, "cz-1.posm": cz, "sk-1.posm": sk }, r2: null };
  const asked = [];
  const f = async (url, opts) => {
    const [host, file] = url.split("/");
    asked.push(host);
    const at = hosts[host];
    if (!at) return new Response("", { status: 503 });
    if (file === "index.json") return Response.json(at[file]);
    const [, s, e] = /bytes=(\d+)-(\d+)/.exec(opts.headers.Range).map(Number);
    return new Response(at[file].subarray(s, e + 1), { status: 206, headers: { ETag: "x" } });
  };
  const set = new PackSet(["r2", "pages"], { fetch: f });
  const lists = await set.tiles(["2884_10016", "2885_10016", "9_9"]);
  assert.deepEqual(lists, [decodeTile(text("2884_10016")), decodeTile(text("2885_10016"))]);
  assert.deepEqual([...new Set(asked)], ["r2", "pages"]);
  hosts.pages = null; // both down (a fresh set: the first has the tile read already): an error, the next cut tries R2 first again
  const down = new PackSet(["r2", "pages"], { fetch: f });
  await assert.rejects(down.tiles(["2884_10016"]));
  assert.equal(down.at, 0);
});

test("jen balíky, jejichž obdélník drží dlaždice řezu; chyba jednoho balíku nechá ostatní odpovědět (recenze Německa)", async () => {
  const cz = packTiles(["2884_10016"], text).file;
  const index = { files: { cz: "cz-1.posm", de_by: "de_by-1.posm", at: "at-1.posm" }, bbox: { cz: [2884, 10016, 2884, 10016], de_by: [2885, 10016, 2885, 10016], at: [1, 1, 2, 2] } };
  const asked = [];
  const f = async (url, opts) => {
    const file = url.split("/")[1];
    asked.push(file);
    if (file === "index.json") return Response.json(index);
    if (file === "de_by-1.posm") return new Response("", { status: 503 });
    const [, s, e] = /bytes=(\d+)-(\d+)/.exec(opts.headers.Range).map(Number);
    return new Response({ "cz-1.posm": cz }[file].subarray(s, e + 1), { status: 206, headers: { ETag: "x" } });
  };
  const set = new PackSet(["r2", "pages"], { fetch: f });
  const lists = await set.tiles(["2884_10016", "2885_10016"]);
  assert.deepEqual(lists, [decodeTile(text("2884_10016"))], "Česko odpoví, i když bavorský balík ne");
  assert.ok(!asked.includes("at-1.posm"), "rakouský balík mimo řez se neotevře");
  assert.equal(set.at, 0, "zůstává R2");
});

test("balík, který na R2 selže, se zkusí na Pages, i když soused s překrytým obdélníkem odpoví prázdně (recenze přenosu)", async () => {
  const cz = packTiles(["2884_10016"], text).file, de = packTiles(["2885_10016"], text).file;
  const r2 = { files: { cz: "cz-1.posm", de_sn: "de_sn-1.posm" }, bbox: { cz: [2884, 10016, 2885, 10016], de_sn: [2884, 10016, 2885, 10016] } };
  const pages = { files: { cz: "cz-1.posm" } };
  const f = async (url, opts) => {
    const [host, file] = url.split("/");
    if (file === "index.json") return Response.json(host === "r2" ? r2 : pages);
    if (host === "r2" && file === "cz-1.posm") return new Response("", { status: 503 });
    const [, s, e] = /bytes=(\d+)-(\d+)/.exec(opts.headers.Range).map(Number);
    return new Response({ "cz-1.posm": cz, "de_sn-1.posm": de }[file].subarray(s, e + 1), { status: 206, headers: { ETag: "x" } });
  };
  const set = new PackSet(["r2", "pages"], { fetch: f });
  const lists = await set.tiles(["2884_10016"]);
  assert.deepEqual(lists, [decodeTile(text("2884_10016"))], "český balík z Pages");
});

// Bára 26. 11. 2026: only the newest file of a state stays on R2, so a page open over the weekly rebuild holds an
// index naming a deleted file. The failed cut reads the index again, the next cut finds the new file.
test("smazaný starý balík: stránka otevřená přes týdenní obnovu přečte index znovu", async () => {
  const cz = packTiles(["2884_10016"], text).file;
  let index = { files: { at: "at-1.posm" } };
  const files = { "at-1.posm": cz };
  const f = async (url, opts) => {
    const file = url.split("/")[1];
    if (file === "index.json") return Response.json(index);
    if (!files[file]) return new Response("", { status: 404 });
    const [, s, e] = /bytes=(\d+)-(\d+)/.exec(opts.headers.Range).map(Number);
    return new Response(files[file].subarray(s, e + 1), { status: 206, headers: { ETag: file } });
  };
  const set = new PackSet(["r2"], { fetch: f });
  assert.deepEqual(await set.tiles(["2884_10016"]), [decodeTile(text("2884_10016"))]);
  index = { files: { at: "at-2.posm" } }; files["at-2.posm"] = cz; delete files["at-1.posm"];
  assert.deepEqual(await new PackSet(["r2"], { fetch: f }).tiles(["2884_10016"]), [decodeTile(text("2884_10016"))]);
  index = { files: { at: "at-1.posm" } }; // the old index once more: the open page's view
  const old = new PackSet(["r2"], { fetch: f });
  await old.open();
  index = { files: { at: "at-2.posm" } };
  assert.deepEqual(await old.tiles(["2884_10016"]), [decodeTile(text("2884_10016"))], "hned první řez najde nový soubor");
});

test("index se čte znovu jen po 404 souboru (ne po výpadku nebo timeoutu), v jednom řezu nejvýš jednou i při dvou smazaných balících", async () => {
  const cz = packTiles(["2884_10016"], text).file, de = packTiles(["2885_10016"], text).file;
  let index = { files: { cz: "cz-1.posm", de: "de-1.posm" } };
  let files = { "cz-1.posm": cz, "de-1.posm": de }, down = false, indexReads = 0;
  const f = async (url, opts) => {
    const file = url.split("/")[1];
    if (file === "index.json") { indexReads++; return Response.json(index); }
    if (down) return new Response("", { status: 503 });
    if (down === null) throw Object.assign(new Error("timeout"), { name: "TimeoutError" });
    if (!files[file]) return new Response("", { status: 404 });
    const [, s, e] = /bytes=(\d+)-(\d+)/.exec(opts.headers.Range).map(Number);
    return new Response(files[file].subarray(s, e + 1), { status: 206, headers: { ETag: file } });
  };
  const warn = console.warn; console.warn = () => {};
  try {
    const both = [decodeTile(text("2884_10016")), decodeTile(text("2885_10016"))];
    // Both files deleted by the weekly rebuild: the index once, both new files found.
    const set = new PackSet(["r2"], { fetch: f });
    await set.open(); indexReads = 0;
    index = { files: { cz: "cz-2.posm", de: "de-2.posm" } }; files = { "cz-2.posm": cz, "de-2.posm": de };
    assert.deepEqual(await set.tiles(["2884_10016", "2885_10016"]), both);
    assert.equal(indexReads, 1, "index jednou");
    // A server error or a timeout: the index not read again (the cut fails, the next one starts afresh).
    for (const d of [true, null]) {
      const s2 = new PackSet(["r2"], { fetch: f });
      await s2.open(); indexReads = 0; down = d;
      await assert.rejects(s2.tiles(["2884_10016", "2885_10016"]));
      assert.equal(indexReads, 0, `po ${d ? "503" : "timeoutu"} bez nového indexu`);
      down = false;
    }
  } finally { console.warn = warn; }
});
