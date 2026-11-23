// Cyprus (Bára 23. 11. 2026): traffic keeping left, the DLS buildings (towns/cyprus.js), the signs (countries/CY.js), the
// border without the north. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Kypr: budovy DLS (podlaží, typ)", async () => {
  const C = await import("../pilot/public/towns/cyprus.js");
  assert.deepEqual(C.dlsBuilding({ B_TYPE: "High residential building", ROOF_TYPE: "Flat roof", FLOOR_QTY: 4, H_ROOF_A_1: 13.55 }),
    { office: undefined, house: undefined, type: "apartments", cornice: 4, total: 4, roof: 0, fromHeight: false, height: 13.6 });
  assert.equal(C.dlsBuilding({ B_TYPE: "Mosque", FLOOR_QTY: 1 }).type, "church");
  assert.equal(C.dlsBuilding({ B_TYPE: "LowResidential Building with inclined roof", FLOOR_QTY: 2 }).type, "house");
  assert.equal(C.dlsBuilding({ B_TYPE: "Commercial building", FLOOR_QTY: 3 }).office, true);
  globalThis.PROFILY_CY = { dls: "0" };
  try { assert.deepEqual(await C.sources.podlaznost(35.17, 33.36), {}); } finally { delete globalThis.PROFILY_CY; }
});

test("Kypr: jízda vlevo, značky a normy", async () => {
  const { COUNTRIES } = await import("../pilot/public/countries/index.js");
  const CY = COUNTRIES.CY, f = CY.signs.file;
  assert.equal(CY.leftHand, true);
  assert.equal(f({ k: "oneway", dir: "forward" }), "oneway");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "noentry");
  assert.equal(f({ k: "zona30" }), null, "zónu 30 Kodex nemá");
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip14a", "ip15a", "ip20a", "ip26a", "ip27a", "c7a", "c8a", "c9a", "c10a"]) {
    const file = f({ k });
    assert.ok(file && fs.existsSync(new URL(`../pilot/public/signs-CY/${file}.svg`, import.meta.url)), `${k}: ${file}`);
  }
  for (const v of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) assert.ok(fs.existsSync(new URL(`../pilot/public/signs-CY/speed-${v}.svg`, import.meta.url)), `${v}`);
  assert.equal(CY.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "Zákaz stání", "Kodex značky nečísluje");
  assert.equal(CY.limits({ type: "parkovani", orient: "kolme" }), null, "rozměry stání nenalezeny");
});

test("Kypr: stát podle hranic (sever a nárazníková zóna mimo)", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(35.17, 33.36), "cyprus"); // Nicosia, the south
  assert.equal(C.cityAt(34.68, 33.045), "cyprus"); // Limassol
  assert.equal(C.cityAt(34.585, 32.985), "cyprus"); // Akrotiri (a British base)
  assert.equal(C.cityAt(35.0130, 33.7380), "cyprus"); // Xylotymbou, inside Dhekelia
  assert.equal(C.cityAt(35.185, 33.364), "cizina"); // Nicosia, the north
  assert.equal(C.cityAt(35.34, 33.319), "cizina"); // Kyrenia
  assert.equal(C.cityAt(35.045, 33.712), "cizina"); // Pyla (the UN buffer zone; Bára: left out)
});
