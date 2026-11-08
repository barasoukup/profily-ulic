import { test } from "node:test";
import assert from "node:assert/strict";
import { shares } from "../pilot/public/shares.js";

test("podíl prostoru sečte šířky podle skupin a dá 100 %", () => {
  const s = shares({ segments: [
    { type: "chodnik", width: 3 }, { type: "parkovani", width: 2 }, { type: "pruh", width: 3 },
    { type: "tramvaj_v_pruhu", width: 3 }, { type: "cyklopruh", width: 1.5 }, { type: "stromorad", width: 2.5 }, { type: "zed", width: 1 },
  ] });
  const by = Object.fromEntries(s.map((g) => [g.key, g.m]));
  assert.deepEqual(by, { pesi: 3, kola: 1.5, mhd: 3, auta: 3, parkovani: 2, zelen: 2.5, ostatni: 1 });
  assert.ok(Math.abs(s.reduce((a, g) => a + g.pct, 0) - 100) < 1e-9);
});
