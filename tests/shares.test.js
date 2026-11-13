import { test } from "node:test";
import assert from "node:assert/strict";
import { shares, surfaces } from "../pilot/public/shares.js";

test("podíl prostoru sečte šířky podle skupin a dá 100 %", () => {
  const s = shares({ segments: [
    { type: "chodnik", width: 3 }, { type: "parkovani", width: 2 }, { type: "pruh", width: 3 },
    { type: "tramvaj_v_pruhu", width: 3 }, { type: "cyklopruh", width: 1.5 }, { type: "stromorad", width: 2.5 }, { type: "zed", width: 1 },
  ] });
  const by = Object.fromEntries(s.map((g) => [g.key, g.m]));
  assert.deepEqual(by, { pesi: 3, kola: 1.5, mhd: 1.5, auta: 4.5, parkovani: 2, zelen: 2.5, ostatni: 1 });
  assert.ok(Math.abs(s.reduce((a, g) => a + g.pct, 0) - 100) < 1e-9);
});

test("sdílené části se dělí napůl", () => {
  const by = Object.fromEntries(shares({ segments: [{ type: "stezka_sdilena", width: 4 }, { type: "bus_cyklo", width: 4 }, { type: "chodnik_kola", width: 2 }] }).map((g) => [g.key, g.m]));
  assert.equal(by.pesi, 4);
  assert.equal(by.kola, 4);
  assert.equal(by.mhd, 2);
});

test("povrch ulice: propustné, částečně propustné, nepropustné (Magdalena)", () => {
  const p = { segments: [
    { type: "chodnik", width: 3 }, { type: "chodnik", width: 2, permeable: true }, { type: "cyklostezka", width: 2, permeable: "nezpevneny" },
    { type: "zelen", width: 2 }, { type: "tramvaj", width: 3, bed: "trava" }, { type: "tramvaj", width: 3, bed: "panely" },
    { type: "pruh", width: 3 }, { type: "voda", width: 2 },
  ] };
  const m = Object.fromEntries(surfaces(p).map((g) => [g.key, g.m]));
  assert.deepEqual(m, { propustne: 7, castecne: 2, nepropustne: 9, jine: 2 });
});

test("povrch ulice: štěrkové těleso, těleso bez povrchu, rýha, nádrž, zeď a díra", () => {
  const p = { segments: [{ type: "tramvaj", width: 3, bed: "strk" }, { type: "tramvaj", width: 3 }, { type: "ryha", width: 1 }, { type: "nadrz", width: 2 },
    { type: "zed", width: 0.5 }, { type: "nezname", width: 1.5 }, { type: "krajnice", width: 1, permeable: "nezpevneny" }] };
  const m = Object.fromEntries(surfaces(p).map((g) => [g.key, g.m]));
  assert.deepEqual(m, { propustne: 5, castecne: 0, nepropustne: 3, jine: 4 });
});
