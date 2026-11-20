// Belgium and Luxembourg (Bára 20. 11. 2026): the regions' lines for the kerbs (towns/belgium.js), the states by their
// borders, the signs, norms and parking laws. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Belgie: čáry GRB a PICC jako kandidáti obrub, vypínač ?hrany=0", async () => {
  const B = await import("../pilot/public/towns/belgium.js");
  const grb = B.grbPaths({ features: [
    { properties: { LBLTYPE: "rand van de rijbaan (wrb)" }, geometry: { type: "LineString", coordinates: [[3.72, 51.05], [3.721, 51.05]] } },
    { properties: { LBLTYPE: "grens zone zwakke weggebruiker (wcz)" }, geometry: { type: "MultiLineString", coordinates: [[[3.72, 51.051], [3.721, 51.051]]] } },
    { properties: { LBLTYPE: "iets anders" }, geometry: { type: "LineString", coordinates: [[3.72, 51.052], [3.721, 51.052]] } },
  ] });
  assert.equal(grb.length, 2);
  const picc = B.piccPaths({ features: [
    { attributes: { NATUR_DESC: "Trottoir" }, geometry: { paths: [[[5.57, 50.64], [5.571, 50.64]]] } },
    { attributes: { NATUR_DESC: "Rigole" }, geometry: { paths: [[[5.57, 50.641], [5.571, 50.641]]] } },
    { attributes: { NATUR_DESC: "Passage piéton" }, geometry: { paths: [[[5.57, 50.642], [5.571, 50.642]]] } },
  ] });
  assert.equal(picc.length, 1, "jen okraje částí ulice, ne strouha ani přechod");
  globalThis.PROFILY_BE = { hrany: "0" };
  try { assert.deepEqual((await B.sources.lines("5.57,50.64,5.58,50.65")).edges, []); } finally { delete globalThis.PROFILY_BE; }
});

test("Belgie: region podle hranic NUTS 1 (ortofoto a čáry jen svého regionu)", async () => {
  const { beRegionsAt } = await import("../pilot/public/lanes-ortho.js");
  assert.equal((await beRegionsAt(3.7174, 51.0543))[0], "vl"); // Ghent
  assert.equal((await beRegionsAt(5.5797, 50.6326))[0], "wal"); // Liège
  assert.equal((await beRegionsAt(4.3525, 50.8467))[0], "bru"); // Brussels
});

test("Belgie a Lucembursko: stát podle hranic", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(50.8467, 4.3525), "belgium"); // Brussels
  assert.equal(C.cityAt(51.0543, 3.7174), "belgium"); // Ghent
  assert.equal(C.cityAt(50.6326, 5.5797), "belgium"); // Liège
  assert.equal(C.cityAt(49.6116, 6.1319), "luxembourg"); // Luxembourg
  assert.equal(C.cityAt(49.4958, 5.9806), "luxembourg"); // Esch-sur-Alzette
  assert.equal(C.cityAt(50.8514, 5.691), "netherlands"); // Maastricht
  assert.equal(C.cityAt(50.7753, 6.0839), "germany"); // Aachen
  assert.equal(C.countryOfCity("belgium").code, "BE");
  assert.equal(C.countryOfCity("luxembourg").code, "LU");
});

test("Belgie a Lucembursko: značky, normy, zákon o stání", async () => {
  const { default: BE } = await import("../pilot/public/countries/BE.js");
  const { default: LU } = await import("../pilot/public/countries/LU.js");
  assert.equal(BE.signs.file({ k: "oneway" }, { dir: "forward" }), "F19");
  assert.equal(BE.signs.file({ k: "oneway" }, { dir: "backward" }), "C1");
  assert.equal(BE.signs.file({ k: "oneway", plate: "protismer" }, { dir: "backward" }), null);
  assert.equal(BE.signs.file({ k: "b20a", v: 30 }), "C43_30");
  assert.equal(BE.signs.file({ k: "b20a", v: 40 }), null);
  assert.equal(BE.signs.file({ k: "ztp" }), null, "E9 s tabulkou ZTP není nakreslená");
  assert.equal(LU.signs.file({ k: "oneway" }, { dir: "forward" }), "E_13a");
  assert.equal(LU.signs.file({ k: "b20a", v: 30 }), null, "lucemburská 30 jako SVG chybí");
  assert.equal(LU.signs.label({ k: "c9a" }, true, "x"), "D,5b x");
  for (const [dir, list] of [["signs-BE", ["C1", "C3", "C11", "C19", "C43_50", "E1", "E3", "E9", "F4a", "F19", "F12a", "F103", "D07", "D09", "D10", "D11"]],
    ["signs-LU", ["C_2", "C_1a", "C_3c", "C_14_50", "E_13a", "C_18", "C_19", "E_23", "H_1_1", "E_25a", "D_4", "D_5b"]]]) {
    for (const k of list) assert.match(fs.readFileSync(new URL(`../pilot/public/${dir}/${k}.svg`, import.meta.url), "utf8"), /<svg[^>]*viewBox="[-\d.]+ [-\d.]+ [\d.]+ [\d.]+"/, `${dir}/${k}`);
  }
  assert.equal(BE.limits({ type: "chodnik" }, [], 0).min, 1.5);
  assert.equal(LU.limits({ type: "chodnik" }, [], 0).zaklad, 2);
  assert.equal(BE.limits({ type: "pruh" }, [{ type: "pruh" }], 0), null, "zdroj jen pro hlavní silnice Flander: bez varování");
  assert.equal(BE.limits({ type: "cyklostezka" }).min, 1.3);
  assert.equal(BE.limits({ type: "parkovani", orient: "podelne" }), null);
  assert.equal(LU.limits({ type: "cyklostezka" }).min, 1.2);
  assert.equal(LU.parkGuess, false, "Lucembursko obecnou šířku nemá");
  assert.equal(BE.lawNeed(true, 1, 2.5), 3);
});
