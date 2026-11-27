// Slimming the OSM packs (tools/osm_slim.mjs): only what the app never reads goes, so the tiles of a cut give the same
// elements as before, but for the ids of areas and points and the keys no code reads.
import { test } from "node:test";
import assert from "node:assert/strict";
import { packTiles } from "../tools/pack_osm_tiles.mjs";
import { Pack } from "../pilot/public/osmpack.js";
import { mergePieces } from "../pilot/public/osmtile.js";

// Tile 2884_10016 starts at 14.42°, 50.08° (5000 × 1e-6° a tile, 500 × 1e-5°).
const X = 14420000, Y = 50080000, X5 = 1442000, Y5 = 5008000;
const house = (id, x, y) => ({ t: "a", i: id, k: { building: "yes", "building:levels": "4" }, g: [X5 + x, Y5 + y, 3, 0, 0, 3, -3, 0, 0, -3], q: 5 });
const TILES = {
  "2884_10016": [
    { t: "w", i: 1001, k: { highway: "residential", name: "Dlouhá", "name:de": "Lange Gasse", "name:etymology:wikidata": "Q1" }, o: 0, g: [X + 4000, Y + 100, 1500, 0] },
    house(2001, 10, 10),
    // Over the tile border: in both tiles, keeps its id.
    { t: "a", i: 2002, k: { building: "yes" }, g: [X5 + 498, Y5 + 20, 4, 0, 0, 3, -4, 0, 0, -3], q: 5 },
    // Two shapes with the same first two points and length: both keep their ids (mergePieces would take them as one).
    house(2003, 100, 100), house(2004, 100, 100),
    { t: "n", i: 3001, k: { natural: "tree", "ref:IFOPT": "x" }, g: [X + 10, Y + 10] },
  ],
  "2885_10016": [
    { t: "w", i: 1001, k: { highway: "residential", name: "Dlouhá", "name:de": "Lange Gasse", "name:etymology:wikidata": "Q1" }, o: 1, g: [X + 5500, Y + 100, 1000, 0] },
    { t: "a", i: 2002, k: { building: "yes" }, g: [X5 + 498, Y5 + 20, 4, 0, 0, 3, -4, 0, 0, -3], q: 5 },
  ],
};
const text = (n) => TILES[n].map((e) => JSON.stringify(e)).join("\n") + "\n";
const read = (file) => async (s, e) => ({ bytes: new Uint8Array(file.subarray(s, e + 1)) });
const cut = async (file) => mergePieces(await new Pack(read(file)).tiles(Object.keys(TILES)));

test("zmenšení balíku: id ploch a bodů v jedné dlaždici 0, cesty a plochy přes hranici svoje id", async () => {
  const stats = {};
  const slim = await cut(packTiles(Object.keys(TILES), text, { slim: ["ids", "tags"], stats }).file);
  const full = await cut(packTiles(Object.keys(TILES), text).file);
  assert.equal(slim.length, full.length);
  const ids = Object.fromEntries(full.map((el, i) => [el.id, slim[i].id]));
  assert.deepEqual(ids, { 1001: 1001, 2001: 0, 2002: 2002, 2003: 2003, 2004: 2004, 3001: 0 });
  assert.deepEqual(stats, { ids: 2, tags: 5 }); // the keys counted in each tile of the way
  // The rest the same: geometry, order, the keys the app reads.
  slim.forEach((el, i) => {
    assert.deepEqual(el.geometry, full[i].geometry);
    assert.equal(el.type, full[i].type);
  });
  assert.deepEqual(slim.find((e) => e.id === 1001).tags, { highway: "residential", name: "Dlouhá" });
  assert.deepEqual(slim.find((e) => e.type === "node").tags, { natural: "tree" });
  assert.equal(slim.find((e) => e.type === "way").geometry.length, 3); // the pieces of the way joined again
});
