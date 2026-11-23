// Spain (Bára 23. 11. 2026): Zaragoza's paving map, the Catastro's buildings (towns/spain.js), CartoCiudad's search
// (search-es.js), the signs (countries/ES.js), the state by its border. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Španělsko: mapa povrchů Zaragozy (chodník, střední pás, zelený pás), vozovka podél os OSM, vypínač ?zaragoza=0", async () => {
  const E = await import("../pilot/public/towns/spain.js");
  const sq = (x) => [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]];
  const got = E.zaragozaFeatures([[702, { features: [{ geometry: { type: "MultiPolygon", coordinates: [sq(0), sq(2)] } }] }], [1003, { features: [{ geometry: { type: "Polygon", coordinates: sq(4) } }] }]]);
  assert.deepEqual(got.features.map((f) => f.attributes.code), [702, 702, 1003], "MultiPolygon po polygonech");
  // A band about each road segment: 4 corners + the closing one, half 10 m for a tertiary road, marked as an estimate.
  const bands = E.roadBands([{ type: "way", tags: { highway: "tertiary" }, geometry: [{ lon: -0.88, lat: 41.65 }, { lon: -0.879, lat: 41.65 }] },
    { type: "way", tags: { highway: "footway" }, geometry: [{ lon: -0.88, lat: 41.65 }, { lon: -0.879, lat: 41.65 }] },
    { type: "way", tags: { highway: "primary", tunnel: "yes" }, geometry: [{ lon: -0.88, lat: 41.65 }, { lon: -0.879, lat: 41.65 }] }], 41.65);
  assert.equal(bands.length, 1, "jen silnice, ne chodník ani tunel");
  assert.equal(bands[0].attributes.CTVUK_KOD, 701);
  assert.equal(bands[0].attributes.ODHAD, 1);
  const lats = bands[0].geometry.rings[0].map(([, y]) => y);
  assert.ok(Math.abs((Math.max(...lats) - Math.min(...lats)) * 110574 - 20) < 0.01, "pás 2 × 10 m");
  globalThis.PROFILY_ES = { zaragoza: "0" };
  try { assert.deepEqual(await E.sources.surfaces("-0.884,41.648,-0.882,41.650"), { features: [], abroad: true }); } finally { delete globalThis.PROFILY_ES; }
  assert.deepEqual(await E.sources.surfaces("-3.704,40.416,-3.702,40.418"), { features: [], abroad: true }, "Madrid: bez mapy, bez dotazu");
});

test("Španělsko: budovy z katastru (podlaží části u fasády, rok, užití)", async () => {
  const E = await import("../pilot/public/towns/spain.js");
  const part = (floors, ring) => `<gml:featureMember><bu-ext2d:BuildingPart><bu-ext2d:numberOfFloorsAboveGround>${floors}</bu-ext2d:numberOfFloorsAboveGround><gml:posList srsDimension="2">${ring.map(([x, y]) => `${y} ${x}`).join(" ")}</gml:posList></bu-ext2d:BuildingPart></gml:featureMember>`;
  const sq = (x) => [[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]];
  const building = `<gml:featureMember><bu-ext2d:Building><bu-core2d:beginning>1966-01-01T00:00:00</bu-core2d:beginning><bu-ext2d:currentUse>1_residential</bu-ext2d:currentUse><bu-ext2d:numberOfDwellings>12</bu-ext2d:numberOfDwellings></bu-ext2d:Building></gml:featureMember>`;
  const parts = part(8, sq(0)) + part(2, sq(2));
  assert.deepEqual(E.catastroBuilding(building, parts, 0.5, 0.5), { built: 1966, office: undefined, house: undefined, type: "apartments", cornice: 8, total: 8, roof: 0 });
  assert.equal(E.catastroBuilding(building, parts, 0.5, 2.5).total, 2, "dvorní část nižší");
  assert.equal(E.catastroBuilding(building, parts, 0.5, 9).total, 8, "bod mimo části: nejvyšší");
  assert.deepEqual(E.catastroBuilding("", "", 0, 0), {});
  globalThis.PROFILY_ES = { catastro: "0" };
  try { assert.deepEqual(await E.sources.podlaznost(40.4, -3.7), {}); } finally { delete globalThis.PROFILY_ES; }
});

test("Španělsko: hledání CartoCiudad (adresa s bodem, ulice bez bodu až přes find)", async () => {
  const S = await import("../pilot/public/search-es.js");
  const got = S.parseEs([
    { type: "portal", address: "GRAN VIA", portalNumber: 11, muni: "Mula", lat: 38.04, lng: -1.49, id: "a" },
    { type: "callejero", address: "CALLE ALCALA, Madrid", lat: 0, lng: 0, id: "280790007456" },
    { type: "Municipio", address: "Zaragoza, Zaragoza", lat: 0, lng: 0, id: "50297" },
    { type: "toponimo", address: "X", lat: 1, lng: 1 },
  ]);
  assert.deepEqual(got.map((x) => [x.text, x.type, !!x.at]), [["GRAN VIA 11, Mula", "AdresniMisto", true], ["CALLE ALCALA, Madrid", "Ulice", false], ["Zaragoza, Zaragoza", "Obec", false]]);
  assert.deepEqual(got[1].find, { id: "280790007456", type: "callejero" });
  assert.deepEqual(S.wktPoint("MULTILINESTRING((-3.70 40.41,-3.69 40.42,-3.68 40.43),(1 1,2 2))"), { lon: -3.69, lat: 40.42 });
  assert.deepEqual(S.wktPoint("POINT(-3.7 40.4)"), { lon: -3.7, lat: 40.4 });
  assert.ok(S.looksSpanish("calle de alcalá") && S.looksSpanish("carrer de balmes") && !S.looksSpanish("Václavské náměstí"));
});

test("Španělsko: značky (S-11 / R-101 podle směru, R-301, autopista a autovía)", async () => {
  const { COUNTRIES } = await import("../pilot/public/countries/index.js");
  const ES = COUNTRIES.ES, f = ES.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "S-11");
  assert.equal(f({ k: "oneway", dir: "backward" }), "R-101");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "R-101-plus-S-880d");
  assert.equal(f({ k: "b20a", v: 30 }), "R-301-30");
  assert.equal(f({ k: "b20a", v: 35 }), null);
  assert.equal(f({ k: "ip14a", ref: "AP-7" }), "S-1");
  assert.equal(f({ k: "ip14a", ref: "A-2" }), "S-1a");
  assert.equal(f({ k: "ztp" }), null, "vyhrazené stání jen s textem: nekreslí se");
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip15a", "ip20a", "zona30", "ip26a", "sdilena", "ip27a", "c8a", "c9a", "c10a", "c7a"]) {
    const file = f({ k });
    assert.ok(file && fs.existsSync(new URL(`../pilot/public/signs-ES/${file}.svg`, import.meta.url)), `${k}: ${file}`);
  }
  for (const v of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]) assert.ok(fs.existsSync(new URL(`../pilot/public/signs-ES/R-301-${v}.svg`, import.meta.url)), `R-301-${v}`);
  assert.equal(ES.lawNeed(false, 2), 3, "3 m k protějšímu okraji (čl. 91.2 a RGC)");
  assert.equal(ES.limits({ type: "chodnik", width: 1.5 }, []).min, 1.8);
});

test("Španělsko: stát podle hranic (ostrovy, Ceuta, Melilla, Llívia)", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(40.4168, -3.7038), "spain"); // Madrid
  assert.equal(C.cityAt(41.3874, 2.1686), "spain"); // Barcelona
  assert.equal(C.cityAt(39.5696, 2.6502), "spain"); // Palma
  assert.equal(C.cityAt(28.1235, -15.4363), "spain"); // Las Palmas
  assert.equal(C.cityAt(35.8894, -5.3213), "spain"); // Ceuta
  assert.equal(C.cityAt(42.465, 1.98), "spain"); // Llívia
  assert.equal(C.cityAt(42.5063, 1.5218), "cizina"); // Andorra la Vella
  assert.equal(C.cityAt(36.1408, -5.3536), "cizina"); // Gibraltar
  assert.equal(C.cityAt(43.48, -1.56), "france"); // Biarritz
  assert.equal(C.countryOfCity("spain").code, "ES");
});
