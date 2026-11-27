// Cyprus (Bára 23. 11. 2026): traffic keeping left, the DLS buildings (towns/cyprus.js), the signs (countries/CY.js), the
// border without the north. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Kypr: budovy DLS (podlaží, typ)", async () => {
  const C = await import("../app/public/towns/cyprus.js");
  assert.deepEqual(C.dlsBuilding({ B_TYPE: "High residential building", ROOF_TYPE: "Flat roof", FLOOR_QTY: 4, H_ROOF_A_1: 13.55 }),
    { office: undefined, house: undefined, type: "apartments", cornice: 4, total: 4, roof: 0, fromHeight: false, height: 13.6 });
  assert.equal(C.dlsBuilding({ B_TYPE: "Mosque", FLOOR_QTY: 1 }).type, "church");
  assert.equal(C.dlsBuilding({ B_TYPE: "LowResidential Building with inclined roof", FLOOR_QTY: 2 }).type, "house");
  assert.equal(C.dlsBuilding({ B_TYPE: "Commercial building", FLOOR_QTY: 3 }).office, true);
  globalThis.PROFILY_CY = { dls: "0" };
  try { assert.deepEqual(await C.sources.podlaznost(35.17, 33.36), {}); } finally { delete globalThis.PROFILY_CY; }
});

test("Kypr: jízda vlevo, značky a normy", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const CY = COUNTRIES.CY, f = CY.signs.file;
  assert.equal(CY.leftHand, true);
  assert.equal(f({ k: "oneway", dir: "forward" }), "oneway");
  assert.equal(f({ k: "oneway", dir: "backward" }), "noentry");
  assert.equal(f({ k: "oneway" }, { dir: "backward" }), "noentry", "směr podle pruhu");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), null, "tabulku „kromě cyklistů“ Kodex nemá, zákaz vjezdu by lhal");
  assert.equal(f({ k: "zona30" }), null, "zónu 30 Kodex nemá");
  assert.equal(f({ k: "ip27a" }), null, "pěší zónu Kodex nemá (Bára 23. 11. 2026: nekreslit)");
  assert.equal(f({ k: "c10a", walk: "left" }), "c10a-chodci-vlevo", "chodci na své straně");
  // Each key on the sign the review checked against the Code (NORMY.md C2; signs-CY/README.md), not just some file.
  const expected = { b1: "b1", b11: "b11", b8: "b8", b30: "b30", b28: "b28", b29: "b29", ip11a: "p", ip14a: "motorway", ip15a: "expressway",
    ip20a: "bus", ip26a: "ip26a", c7a: "ped", c8a: "c8a", c9a: "c9a", c10a: "c10a" };
  for (const [k, file] of Object.entries(expected)) assert.equal(f({ k }), file, k);
  const licence = JSON.parse(fs.readFileSync(new URL("../evaluation/cyprus/signs-licence.json", import.meta.url), "utf8"));
  for (const file of [...new Set([...Object.values(expected), "noentry", "oneway", "c10a-chodci-vlevo"])]) {
    assert.ok(fs.existsSync(new URL(`../app/public/signs-CY/${file}.svg`, import.meta.url)), file);
    assert.ok(licence[file], `licence ${file}`);
  }
  for (const v of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) assert.ok(fs.existsSync(new URL(`../app/public/signs-CY/speed-${v}.svg`, import.meta.url)), `${v}`);
  assert.equal(CY.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "Zákaz stání", "Kodex značky nečísluje");
  // The files under the Open Government Licence (their credit in the export) are those of signs-licence.json.
  const ogl = Object.entries(JSON.parse(fs.readFileSync(new URL("../evaluation/cyprus/signs-licence.json", import.meta.url), "utf8"))).filter(([, v]) => /OGL/.test(v.lic)).map(([k]) => k).sort();
  assert.deepEqual([...CY.signs.ogl].sort(), ogl);
  assert.equal(CY.limits({ type: "parkovani", orient: "kolme" }), null, "rozměry stání nenalezeny");
  // The manual is a recommendation: the sidewalk only orange, by the street's class (review of 23. 11. 2026).
  const walk = (roadClass) => { const x = CY.limits({ type: "chodnik" }, [{ type: "chodnik" }, { type: "pruh", roadClass }], 0); return [x.min, x.zaklad]; };
  assert.deepEqual(walk("mk4"), [0, 2]);
  assert.deepEqual(walk("mk2"), [0, 2.5], "sběrná (OSM primary, secondary)");
  assert.equal(CY.limits({ type: "pruh", roadClass: "mk2" }, [], 0).zaklad, 3.5);
  assert.equal(CY.limits({ type: "pruh", roadClass: "mk4" }, [], 0).zaklad, 3);
  const lane = (dir) => { const segs = [{ type: "cyklopruh", dir }, { type: "pruh", dir: "forward" }]; return CY.limits(segs[0], segs, 0); };
  assert.equal(lane("forward").min, 1.5);
  assert.equal(lane("backward").min, 2, "cyklopruh v protisměru 2 m");
  assert.equal(CY.limits({ type: "cyklostezka", dir: "forward" }, [], 0).zaklad, 2);
  assert.equal(CY.limits({ type: "cyklostezka" }, [], 0).zaklad, 3, "obousměrná");
});

test("Kypr: stát podle hranic (sever bez profilu, nárazníková zóna podle hranice OSM)", async () => {
  const C = await import("../app/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../app/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../app/public/staty.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(35.17, 33.36), "cyprus"); // Nicosia, the south
  assert.equal(C.cityAt(34.68, 33.045), "cyprus"); // Limassol
  assert.equal(C.cityAt(34.585, 32.985), "cyprus"); // Akrotiri (a British base)
  assert.equal(C.cityAt(35.0130, 33.7380), "cyprus"); // Xylotymbou, inside Dhekelia
  assert.equal(C.cityAt(35.185, 33.364), "cizina"); // Nicosia, the north
  assert.equal(C.cityAt(35.34, 33.319), "cizina"); // Kyrenia
  // The north: no profile (Bára 23. 11. 2026); the republic's border by OSM takes in parts of the UN buffer zone (Pyla).
  assert.match(C.closedAt(35.185, 33.364), /Kypr/);
  assert.equal(C.closedAt(35.17, 33.36), null);
  // Pyla, Mammari and Nicosia airport lie in the buffer zone, inside OSM's border of the republic (review of 23. 11. 2026).
  assert.equal(C.cityAt(35.0142, 33.6925), "cyprus"); // Pyla
  assert.equal(C.cityAt(35.1756, 33.2051), "cyprus"); // Mammari
  assert.equal(C.closedAt(35.0142, 33.6925), null);
});
