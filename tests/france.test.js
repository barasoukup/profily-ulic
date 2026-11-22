// France (Bára 22. 11. 2026): Paris's Plan de voirie and IGN's BD TOPO (towns/france.js), the state by its border.
// No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Francie: mapa povrchů Paříže (třídy Plan de voirie na kódy MTVU), vypínač ?paris=0", async () => {
  const F = await import("../pilot/public/towns/france.js");
  assert.equal(F.parisCode({ lib_classe: "Chaussée" }), 701);
  assert.equal(F.parisCode({ lib_classe: "Trottoir" }), 702);
  assert.equal(F.parisCode({ lib_classe: "Piste cyclable" }), 703);
  assert.equal(F.parisCode({ lib_classe: "Piste" }), 704, "zálivy stání a zásobování u obruby (na ortofotu auta)");
  assert.equal(F.parisCode({ lib_classe: "Couloir bus" }), 701);
  assert.equal(F.parisCode({ lib_classe: "Terre-plein" }), 1003);
  assert.equal(F.parisCode({ lib_classe: "Passage piéton" }), null);
  // The bays and cycle tracks come before the roadway and the sidewalks (the first surface a point lies in wins).
  const sq = (x) => ({ geometry: { type: "Polygon", coordinates: [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]] } });
  const got = F.parisFeatures([[{ lib_classe: "Piste", geo_shape: sq(0) }], [], [], [{ lib_classe: "Chaussée", geo_shape: sq(0) }], [{ lib_classe: "Trottoir", geo_shape: sq(2) }]]);
  assert.deepEqual(got.features.map((f) => f.attributes.code), [704, 701, 702]);
  globalThis.PROFILY_FR = { paris: "0" };
  try { assert.deepEqual(await F.sources.surfaces("2.350,48.856,2.353,48.858"), { features: [], abroad: true }); } finally { delete globalThis.PROFILY_FR; }
  assert.deepEqual(await F.sources.surfaces("4.832,45.759,4.835,45.761"), { features: [], abroad: true }, "Lyon: bez mapy, bez dotazu");
  assert.deepEqual((await F.sources.lines("4.832,45.759,4.835,45.761")).widths, [], "šířky BD TOPO jen s ?sirka=1");
});

test("Francie: budovy a šířky BD TOPO", async () => {
  const F = await import("../pilot/public/towns/france.js");
  const b = F.bdtopoBuilding({ properties: { nature: "Indifférenciée", usage_1: "Résidentiel", hauteur: 28.3, nombre_d_etages: 6, nombre_de_logements: 15, date_d_apparition: "1830-01-01Z" } });
  assert.equal(b.built, 1830);
  assert.equal(b.total, 6);
  assert.equal(b.type, "apartments");
  assert.equal(b.height, 28.3);
  assert.equal(F.bdtopoBuilding({ properties: { nature: "Eglise" } }).type, "church");
  assert.equal(F.bdtopoBuilding({ properties: { usage_1: "Religieux" } }).office, undefined, "kostel není kancelář");
  assert.equal(F.bdtopoBuilding({ properties: { nature: "Industriel, agricole ou commercial", usage_1: "Commercial et services" } }).type, "office", "obchodní dům není hala");
  assert.equal(F.bdtopoBuilding({ properties: { hauteur: 15.9 } }).total, 5, "bez počtu podlaží podle výšky");
  assert.equal(F.bdtopoBuilding({ properties: { hauteur: 16.7, nombre_d_etages: 8 } }).total, 6, "nepravděpodobný počet: podle výšky");
  assert.equal(F.bdtopoBuilding({ properties: { usage_1: "Résidentiel", nombre_de_logements: 1 } }).house, true);
  const w = F.bdtopoWidths({ features: [
    { properties: { largeur_de_chaussee: 7, position_par_rapport_au_sol: "0", etat_de_l_objet: "En service" }, geometry: { type: "LineString", coordinates: [[4.83, 45.76, 166], [4.84, 45.76, 166]] } },
    { properties: { largeur_de_chaussee: 7, position_par_rapport_au_sol: "1", etat_de_l_objet: "En service" }, geometry: { type: "LineString", coordinates: [[4.83, 45.76], [4.84, 45.76]] } },
    { properties: { largeur_de_chaussee: 0, position_par_rapport_au_sol: "0", etat_de_l_objet: "En service" }, geometry: { type: "LineString", coordinates: [[4.83, 45.76], [4.84, 45.76]] } },
  ] });
  assert.deepEqual(w, [{ path: [[4.83, 45.76], [4.84, 45.76]], w: 7 }], "jen u země, bez výšky, s šířkou");
});

test("Francie: stát podle hranic", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(48.8566, 2.3522), "france"); // Paris
  assert.equal(C.cityAt(48.5734, 7.7521), "france"); // Strasbourg
  assert.equal(C.cityAt(41.9192, 8.7386), "france"); // Ajaccio
  assert.equal(C.cityAt(48.5700, 7.8150), "germany"); // Kehl
  assert.equal(C.cityAt(46.2044, 6.1432), "switzerland"); // Genève
  assert.equal(C.cityAt(50.8503, 4.3517), "belgium"); // Bruxelles
  assert.equal(C.cityAt(42.465, 1.98), "cizina"); // Llívia, a Spanish enclave (a hole of France's ring)
  assert.equal(C.cityAt(43.7384, 7.4246), "cizina"); // Monaco
  assert.equal(C.countryOfCity("france").code, "FR");
});

test("Francie: hledání Géoplateforme", async () => {
  const S = await import("../pilot/public/search-fr.js");
  const out = S.parseFr({ features: [{ geometry: { coordinates: [2.36, 48.856] }, properties: { label: "12 Rue de Rivoli 75004 Paris", type: "housenumber", street: "Rue de Rivoli" } },
    { geometry: { coordinates: [2.35, 48.85] }, properties: { label: "Paris", type: "municipality" } }] });
  assert.deepEqual(out, [{ text: "12 Rue de Rivoli 75004 Paris", type: "AdresniMisto", at: { lon: 2.36, lat: 48.856, street: "Rue de Rivoli" } }, { text: "Paris", type: "Obec", at: { lon: 2.35, lat: 48.85 } }]);
  assert.ok(S.looksFrench("rue de Rivoli") && S.looksFrench("Montpellier") && S.looksFrench("Besançon"));
  assert.ok(!S.looksFrench("Vinohradská 12") && !S.looksFrench("Hlavné námestie") && !S.looksFrench("Kôlňa"), "é a ô mají i čeština a slovenština");
});
