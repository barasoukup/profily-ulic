// France (Bára 22. 11. 2026): Paris's Plan de voirie and IGN's BD TOPO (towns/france.js), the state by its border.
// No network.
import { test } from "node:test";
import assert from "node:assert/strict";

test("Francie: mapa povrchů Paříže (třídy Plan de voirie na kódy MTVU), vypínač ?paris=0", async () => {
  const F = await import("../app/public/towns/france.js");
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
});

test("Francie: budovy BD TOPO", async () => {
  const F = await import("../app/public/towns/france.js");
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
});

test("Francie: hledání Géoplateforme", async () => {
  const S = await import("../app/public/search-fr.js");
  const out = S.parseFr({ features: [{ geometry: { coordinates: [2.36, 48.856] }, properties: { label: "12 Rue de Rivoli 75004 Paris", type: "housenumber", street: "Rue de Rivoli" } },
    { geometry: { coordinates: [2.35, 48.85] }, properties: { label: "Paris", type: "municipality" } }] });
  assert.deepEqual(out, [{ text: "12 Rue de Rivoli 75004 Paris", type: "AdresniMisto", at: { lon: 2.36, lat: 48.856, street: "Rue de Rivoli" } }, { text: "Paris", type: "Obec", at: { lon: 2.35, lat: 48.85 } }]);
  assert.ok(S.looksFrench("rue de Rivoli") && S.looksFrench("Montpellier") && S.looksFrench("Besançon"));
  assert.ok(!S.looksFrench("Vinohradská 12") && !S.looksFrench("Hlavné námestie") && !S.looksFrench("Kôlňa"), "é a ô mají i čeština a slovenština");
});

test("Francie: pařížská evidence parkovacích míst (jen stání ve vozovce, způsob stání), vypínač ?parisstani=0", async () => {
  const F = await import("../app/public/towns/france.js");
  const pt = (x) => ({ geo_point_2d: { lon: 2.35, lat: 48.86 }, lon: 12, lar: 1.8, nomvoie: "JACOB", ...x });
  const got = F.parisParking([pt({ typsta: "Longitudinal", locsta: "Chaussée" }), pt({ typsta: "Bataille", locsta: "Faux lincoln", lar: 2.3 }),
    pt({ typsta: "Epi", locsta: "Contre terre plein", lar: 4.5 }), pt({ typsta: "Longitudinal", locsta: "Lincoln" }), pt({ typsta: "Longitudinal", locsta: "Trottoir" }),
    pt({ typsta: "Longitudinal", locsta: "Chaussée", lon: 0 })]);
  assert.deepEqual(got.map((p) => [p.orient, p.w]), [["podelne", 1.8], ["kolme", 2.3], ["sikme", 4.5]], "záliv v chodníku (Lincoln) je plocha mapy, ne stání ve vozovce");
  assert.deepEqual(got[0], { lon: 2.35, lat: 48.86, len: 12, w: 1.8, orient: "podelne", street: "JACOB" });
  globalThis.PROFILY_FR = { parisstani: "0" };
  try { assert.deepEqual(await F.sources.parking("2.350,48.856,2.353,48.858"), { features: [] }); } finally { delete globalThis.PROFILY_FR; }
  assert.deepEqual(await F.sources.parking("4.832,45.759,4.835,45.761"), { features: [] }, "Lyon: bez evidence, bez dotazu");
});
