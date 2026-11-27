// The Netherlands (Bára 20. 11. 2026): the BGT surfaces, BAG and 3D BAG buildings (towns/netherlands.js), PDOK's
// Locatieserver (search-nl.js), the state by its border, the RVV signs, norms and parking law. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sq = (x, y, d = 0.0001) => [[[x - d, y - d], [x + d, y - d], [x + d, y + d], [x - d, y + d], [x - d, y - d]]];

test("Nizozemsko: funkce BGT na kódy MTVU, vypínač ?bgt=0", async () => {
  const N = await import("../app/public/towns/netherlands.js");
  assert.equal(N.bgtCode("wegdeel", { functie: "rijbaan lokale weg" }), 701);
  assert.equal(N.bgtCode("wegdeel", { functie: "voetpad" }), 702);
  assert.equal(N.bgtCode("wegdeel", { functie: "fietspad" }), 703);
  assert.equal(N.bgtCode("wegdeel", { functie: "parkeervlak" }), 704);
  assert.equal(N.bgtCode("wegdeel", { functie: "transitie" }), null);
  assert.equal(N.bgtCode("ondersteunendwegdeel", { functie: "verkeerseiland", fysiek_voorkomen: "open verharding" }), 1003);
  assert.equal(N.bgtCode("ondersteunendwegdeel", { functie: "verkeerseiland", fysiek_voorkomen: "groenvoorziening" }), 401, "zelený ostrůvek (recenze)");
  assert.equal(N.bgtCode("ondersteunendwegdeel", { functie: "berm", fysiek_voorkomen: "groenvoorziening" }), 401);
  assert.equal(N.bgtCode("onbegroeidterreindeel", { fysiek_voorkomen: "erf" }), 603);
  assert.equal(N.bgtCode("pand", {}), 601);
  globalThis.PROFILY_NL = { bgt: "0" };
  try {
    assert.deepEqual(await N.sources.surfaces("4.906,52.360,4.907,52.361"), { features: [], abroad: true }, "bez dotazu na službu");
  } finally { delete globalThis.PROFILY_NL; }
});

test("Nizozemsko: BGT jen v úrovni ulice pod středem, OV-baan s tramvají jako těleso", async () => {
  const N = await import("../app/public/towns/netherlands.js");
  const got = {
    wegdeel: [
      { properties: { functie: "rijbaan lokale weg", relatieve_hoogteligging: 0 }, geometry: { type: "Polygon", coordinates: sq(5, 52) } },
      { properties: { functie: "voetpad", relatieve_hoogteligging: 1 }, geometry: { type: "Polygon", coordinates: sq(5.001, 52) } },
      { properties: { functie: "OV-baan", relatieve_hoogteligging: 0 }, geometry: { type: "Polygon", coordinates: sq(5.002, 52) } },
      { properties: { functie: "OV-baan", relatieve_hoogteligging: 0 }, geometry: { type: "Polygon", coordinates: sq(5.003, 52) } },
    ],
    pand: [{ properties: { relatieve_hoogteligging: 0 }, geometry: { type: "MultiPolygon", coordinates: [sq(5.004, 52)] } }],
    spoor: [{ properties: { functie: "tram", relatieve_hoogteligging: 0 }, geometry: { type: "LineString", coordinates: [[5.002, 51.99995], [5.002, 52.00005]] } }],
  };
  const codes = N.bgtFeatures(got, 5, 52).features.map((f) => [f.attributes.code, f.attributes.ANY_TRAM || 0]);
  assert.deepEqual(codes, [[701, 0], [705, 1], [701, 0], [601, 0]], "most (úroveň 1) vynechán, OV-baan s kolejí 705, bez ní vozovka");
  // On a bridge (OSM bridge=yes) the deck's level: the footway of level 1, not the road below (the review).
  const bridge = N.bgtFeatures({ wegdeel: [got.wegdeel[0], { ...got.wegdeel[1], geometry: { type: "Polygon", coordinates: sq(5, 52) } }] }, 5, 52, { bridge: "yes" });
  assert.deepEqual(bridge.features.map((f) => f.attributes.code), [702]);
  assert.equal(N.osmLevel({ layer: "-1" }), -1);
  // A fietspad beside the roadway where OSM has cycle lanes: the roadway (a fietsstrook); without them a cycle track.
  const lane = { properties: { functie: "fietspad", relatieve_hoogteligging: 0 }, geometry: { type: "Polygon", coordinates: [[[5.0001, 51.9999], [5.00013, 51.9999], [5.00013, 52.0001], [5.0001, 52.0001], [5.0001, 51.9999]]] } };
  const both = { wegdeel: [got.wegdeel[0], lane] };
  globalThis.PROFILY_NL = { fietsstrook: "1" };
  try { assert.deepEqual(N.bgtFeatures(both, 5, 52, { "cycleway:both": "lane" }).features.map((f) => f.attributes.code), [701, 701]); } finally { delete globalThis.PROFILY_NL; }
  assert.deepEqual(N.bgtFeatures(both, 5, 52, { "cycleway:both": "lane" }).features.map((f) => f.attributes.code), [701, 703], "výchozí stav: vypnuto");
  assert.deepEqual(N.bgtFeatures(both, 5, 52, {}).features.map((f) => f.attributes.code), [701, 703]);
  // A light rail (sneltram) crossing a railway bed with no vertex inside it; a planned roadway left out (the review).
  const bed = { properties: { functie: "spoorbaan", relatieve_hoogteligging: 0 }, geometry: { type: "Polygon", coordinates: sq(5, 52) } };
  const plan = { properties: { functie: "rijbaan lokale weg", status: "plan", relatieve_hoogteligging: 0 }, geometry: { type: "Polygon", coordinates: sq(5.001, 52) } };
  const rail = { properties: { functie: "sneltram", relatieve_hoogteligging: 0 }, geometry: { type: "LineString", coordinates: [[5, 51.998], [5, 52.002]] } };
  assert.deepEqual(N.bgtFeatures({ wegdeel: [bed, plan], spoor: [rail] }, 5, 52).features.map((f) => f.attributes.code), [705]);
});

test("Nizozemsko: budova z BAG a 3D BAG", async () => {
  const N = await import("../app/public/towns/netherlands.js");
  const pand = { properties: { bouwjaar: 1750, gebruiksdoel: "bijeenkomstfunctie,winkelfunctie,woonfunctie", aantal_verblijfsobjecten: 9 } };
  const bag3d = { feature: { CityObjects: { x: { attributes: { b3_bouwlagen: 4, b3_dak_type: "slanted", b3_h_dak_70p: 13.1, b3_h_maaiveld: 1 } } } } };
  const b = N.bagBuilding(pand, bag3d);
  assert.equal(b.built, 1750);
  assert.equal(b.type, "apartments");
  assert.equal(b.cornice, 4);
  assert.equal(b.roofType, 1);
  assert.equal(b.height, 12.1);
  assert.equal(N.bagBuilding({ properties: { bouwjaar: 1995, gebruiksdoel: "kantoorfunctie" } }, null).office, true);
});

test("Nizozemsko: hledání PDOK Locatieserver", async () => {
  const S = await import("../app/public/search-nl.js");
  const out = S.parseNl({ response: { docs: [
    { type: "adres", weergavenaam: "Oudegracht 10, 3511AM Utrecht", centroide_ll: "POINT(5.1165 52.0960)", straatnaam: "Oudegracht" },
    { type: "weg", weergavenaam: "Keizersgracht, Amsterdam", centroide_ll: "POINT(4.88 52.37)", straatnaam: "Keizersgracht" },
    { type: "woonplaats", weergavenaam: "Leiden", centroide_ll: "POINT(4.49 52.16)" },
    { type: "postcode", weergavenaam: "3511AM", centroide_ll: "POINT(5 52)" },
  ] } });
  assert.deepEqual(out.map((x) => x.type), ["AdresniMisto", "Ulice", "Obec"]);
  assert.deepEqual(out[0].at, { lon: 5.1165, lat: 52.096, street: "Oudegracht" });
  assert.ok(S.looksDutch("Keizersgracht 12") && S.looksDutch("Utrecht") && !S.looksDutch("Vinohradská 12"));
});

test("Nizozemsko: stát podle hranic, sousedé", async () => {
  const C = await import("../app/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../app/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../app/public/staty.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(52.3727, 4.8933), "netherlands"); // Amsterdam
  assert.equal(C.cityAt(51.9225, 4.4792), "netherlands"); // Rotterdam
  assert.equal(C.cityAt(50.8514, 5.6910), "netherlands"); // Maastricht
  assert.equal(C.cityAt(51.8126, 5.8372), "netherlands"); // Nijmegen
  assert.equal(C.cityAt(51.7880, 6.1390), "germany"); // Kleve
  assert.equal(C.countryOfCity("netherlands").code, "NL");
});

test("Nizozemsko: značky RVV, normy, zákon o stání", async () => {
  const { default: NL } = await import("../app/public/countries/NL.js");
  const f = NL.signs.file;
  assert.equal(f({ k: "oneway" }, { dir: "forward" }), "C3");
  assert.equal(f({ k: "oneway" }, { dir: "backward" }), "C2");
  assert.equal(f({ k: "oneway", plate: "protismer" }, { dir: "backward" }), null, "tabulka „uitgezonderd fietsers“ není nakreslená");
  assert.equal(f({ k: "b20a", v: 30 }), "A1-30");
  assert.equal(f({ k: "b20a", v: 40 }), null);
  assert.equal(f({ k: "b1", plate: "obsluha" }), null);
  assert.equal(f({ k: "ip26a" }), "G5");
  assert.equal(f({ k: "c9a" }), null, "Nizozemsko nemá stezku pro chodce a cyklisty");
  for (const k of ["C1", "C2", "C3", "C12", "C14", "C16", "E1", "E2", "E4", "E6", "E9", "F13", "G1", "G3", "G5", "G7", "G7_Zone", "G11", "A1_30_Zone", "A1-50"]) {
    const svg = fs.readFileSync(new URL(`../app/public/signs-NL/${k}.svg`, import.meta.url), "utf8");
    assert.match(svg, /<svg[^>]*viewBox="[\d.]+ [\d.]+ [\d.]+ [\d.]+"/, k);
  }
  assert.equal(NL.limits({ type: "chodnik" }, [], 0).min, 1.8);
  assert.equal(NL.limits({ type: "cyklopruh" }, [{ type: "parkovani" }, { type: "cyklopruh" }], 1).min, 1.7);
  assert.equal(NL.limits({ type: "parkovani", orient: "sikme" }, [], 0), null);
  assert.equal(NL.lawNeed(true, 1, 2.5), 3.5);
  assert.equal(NL.lawNeed(false, 2, 2), 4.5);
  assert.equal(NL.parkByCycleLane, false);
});
