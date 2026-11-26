// The index of the OSM tiles on R2 (tools/osm_index.mjs): the newest file of each state, the older ones deleted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { osmIndex } from "../tools/osm_index.mjs";

test("index dlaždic na R2: nejnovější soubor každého státu, starší se mažou", () => {
  const o = (name, at) => ({ Key: `osm/${name}`, LastModified: at });
  const { index, remove } = osmIndex({ Contents: [
    o("cz-2026-11-16-aa.posm", "2026-11-16T10:00:00Z"), o("cz-2026-11-09-bb.posm", "2026-11-09T10:00:00Z"), o("cz-2026-11-02-cc.posm", "2026-11-02T10:00:00Z"),
    o("de-2026-11-09-dd.posm", "2026-11-09T12:00:00Z"), o("index.json", "2026-11-16T11:00:00Z"), o("cz-novy.posm", "2026-11-16T10:00:00Z"),
  ] });
  assert.deepEqual(index.files, { cz: "cz-2026-11-16-aa.posm", de: "de-2026-11-09-dd.posm" });
  assert.deepEqual(remove, ["osm/cz-2026-11-09-bb.posm", "osm/cz-2026-11-02-cc.posm"]);
});

test("index dlaždic: německé země jako de_by, obdélník z meta souboru jen pro vybraný soubor", () => {
  const o = (name, at) => ({ Key: `osm/${name}`, LastModified: at });
  const { index } = osmIndex({ Contents: [o("de_by-2026-11-23-aa.posm", "2026-11-23T10:00:00Z"), o("de_nw-2026-11-23-bb.posm", "2026-11-23T10:00:00Z"), o("meta/de_by.json", "2026-11-23T10:00:00Z")] },
    [{ files: { de_by: "de_by-2026-11-23-aa.posm" }, bbox: { de_by: [1, 2, 3, 4] } }, { files: { de_nw: "de_nw-starý.posm" }, bbox: { de_nw: [5, 6, 7, 8] } }]);
  assert.deepEqual(index.files, { de_by: "de_by-2026-11-23-aa.posm", de_nw: "de_nw-2026-11-23-bb.posm" });
  assert.deepEqual(index.bbox, { de_by: [1, 2, 3, 4] });
});

test("obdélník dlaždic balíku i pro 250 000 dlaždic (Česko jich má 246 000; Math.min(...) by přetekl)", async () => {
  const { tilesBox } = await import("../tools/pack_osm_tiles.mjs");
  const names = [];
  for (let i = 0; i < 250000; i++) names.push(`${2800 + (i % 700)}_${9900 + Math.floor(i / 700)}`);
  assert.deepEqual(tilesBox(names), [2800, 9900, 3499, 9900 + 357]);
});

test("index dlaždic: kódy regionů o třech a čtyřech písmenech (fr_als, es_cyl, fr_paca) se nepřeskakují", () => {
  const o = (name, at) => ({ Key: `osm/${name}`, LastModified: at });
  const { index } = osmIndex({ Contents: [o("fr_als-2026-11-23-aa.posm", "2026-11-23T10:00:00Z"), o("es_cyl-2026-11-23-bb.posm", "2026-11-23T10:00:00Z"), o("fr_paca-2026-11-23-cc.posm", "2026-11-23T10:00:00Z")] });
  assert.deepEqual(Object.keys(index.files), ["es_cyl", "fr_als", "fr_paca"]);
});

// it_c, it_i, it_s (26. 11. 2026): a region of one letter was skipped too, so Italy's centre, south and islands were
// on R2 but not in index.json. Every pack of tools/countries.mjs must be indexed.
test("index dlaždic: každý balík z tools/countries.mjs se do indexu dostane (it_c, it_i, it_s)", async () => {
  const { PACKS } = await import("../tools/countries.mjs");
  const Contents = PACKS.map((p) => ({ Key: `osm/${p.code}-2026-11-26-ab12.posm`, LastModified: "2026-11-26T08:00:00Z" }));
  const { index } = osmIndex({ Contents });
  assert.deepEqual(Object.keys(index.files).sort(), PACKS.map((p) => p.code).sort());
});

// The hostile review of 26. 11. 2026: with one file a state kept, a bad new build must not delete the last good one.
test("index dlaždic: nový soubor o víc než 30 % menší se nebere a starý se nemaže", () => {
  const o = (name, at, Size) => ({ Key: `osm/${name}`, LastModified: at, Size });
  const { index, remove, suspect } = osmIndex({ Contents: [
    o("nl_ge-2026-11-30-aa.posm", "2026-11-30T10:00:00Z", 40e6), o("nl_ge-2026-11-23-bb.posm", "2026-11-23T10:00:00Z", 100e6),
    o("cz-2026-11-30-cc.posm", "2026-11-30T10:00:00Z", 95e6), o("cz-2026-11-23-dd.posm", "2026-11-23T10:00:00Z", 100e6),
  ] });
  assert.equal(index.files.nl_ge, "nl_ge-2026-11-23-bb.posm");
  assert.equal(index.files.cz, "cz-2026-11-30-cc.posm");
  assert.deepEqual(remove, ["osm/cz-2026-11-23-dd.posm"]);
  assert.deepEqual(suspect, ["nl_ge-2026-11-30-aa.posm"]);
});
