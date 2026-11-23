// The index of the OSM tiles on R2 (tools/osm_index.mjs): the newest file of each state, the two newest kept.
import { test } from "node:test";
import assert from "node:assert/strict";
import { osmIndex } from "../tools/osm_index.mjs";

test("index dlaždic na R2: nejnovější soubor každého státu, dva nejnovější zůstávají", () => {
  const o = (name, at) => ({ Key: `osm/${name}`, LastModified: at });
  const { index, remove } = osmIndex({ Contents: [
    o("cz-2026-11-16-aa.posm", "2026-11-16T10:00:00Z"), o("cz-2026-11-09-bb.posm", "2026-11-09T10:00:00Z"), o("cz-2026-11-02-cc.posm", "2026-11-02T10:00:00Z"),
    o("de-2026-11-09-dd.posm", "2026-11-09T12:00:00Z"), o("index.json", "2026-11-16T11:00:00Z"), o("cz-novy.posm", "2026-11-16T10:00:00Z"),
  ] });
  assert.deepEqual(index.files, { cz: "cz-2026-11-16-aa.posm", de: "de-2026-11-09-dd.posm" });
  assert.deepEqual(remove, ["osm/cz-2026-11-02-cc.posm"]);
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
